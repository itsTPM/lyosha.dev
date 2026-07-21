---
layout: '@layouts/BlogPostLayout.astro'
title: 'Нет интернета в виртуальных машинах QEMU/KVM'
date: '2025-12-27'
---

## На всякий случай

Сначала убедиться, что сеть существует и активна:

```bash
$ sudo virsh net-list --all
```

```bash
 Name      State    Autostart   Persistent
--------------------------------------------
 default   active   yes         yes
```

Включить сеть можно следующим образом:

```bash
$ sudo virsh net-start default
```

## iptables-nft и UFW

_libvirt >=10.4.0, UFW, виртуальная NAT-сеть_

Начиная с [libvirt v10.4.0 (2024-06-03)](<https://gitlab.com/libvirt/libvirt/-/raw/master/NEWS.rst#:~:text=v10.4.0%20(2024%2D06%2D03)>), если в системе присутствует nftables, правила по умолчанию добавляются через него заместо iptables.

В современных системах обычно установлен iptables-nft, который реализует API традиционного iptables, но под капотом использует nftables. UFW не умеет использовать nftables напрямую, поэтому использует iptables-nft для управления правилами если бэкендом является nftables.

Чтобы трафик дошёл в интернет, все цепочки должны одобрить его. libvirt создаёт свою таблицу с правилами, разрешающими доступ в интернет для виртуальных интерфейсов, однако таблица, созданная iptables-nft по запросу UFW, не имеет исключения для этих интерфейсов. Если UFW настроен на drop/reject, трафик будет отклонён.

По этому поводу есть [issue на GitLab'е](https://gitlab.com/libvirt/libvirt/-/issues/644) с объяснением от разработчика `libvirt`.

### Как исправить

Есть три основных варианта решения, от лёгкого к сложному:

**1. Смена фаервола в конфиге libvirt** - [спасибо комментатору с Reddit](https://www.reddit.com/r/archlinux/comments/1d9dsyy/comment/l7iiale/)

Можно настроить libvirt на добавление правил через iptables, что приведёт к попаданию правил в общую таблицу iptables-nft, и разрешит трафик.

```bash
$ sudo nano /etc/libvirt/network.conf
```

В конец файла добавить:

```bash
firewall_backend = "iptables"
```

Затем перезапустить сервис с новым конфигом:

```bash
$ sudo systemctl restart libvirtd
```

**2. Ручное добавление правил в UFW**

Включить IP-форвардинг [(из man ufw)](https://manpages.ubuntu.com/manpages/bionic/man8/ufw.8.html#:~:text=In%20%20addition%20to%20routing%20rules%20and%20policy%2C%20you%20must%20also%20setup%20IP%20forwarding):

```bash
$ nano /etc/ufw/sysctl.conf
```

Раскомментировать или добавить следующие строки:

```bash
net/ipv4/ip_forward=1
net/ipv6/conf/default/forwarding=1
net/ipv6/conf/all/forwarding=1
```

Перезапустить UFW:

```bash
$ ufw disable
$ ufw enable
```

Затем добавить правила на разрешение трафика (**virbr0** - сетевой интерфейс libvirt):

```bash
$ sudo ufw allow in on virbr0 # Разрешает любой входящий трафик
$ sudo ufw route allow in on virbr0 # Разрешает форвардинг
```

Разрешение любого входящего трафика может быть избыточным и подходить не во всех ситуациях; в таком случае стоит точечно разрешить только нужный трафик.

**3. Переезд с UFW**

Один из вариантов решения - переехать на фронтенд, который поддерживает nftables нативно, без слоя совместимости с API iptables.

Варианты: [**firewalld**](https://firewalld.org/) либо **nft** для более тонкой настройки. Они оба будут более дружелюбны к libvirt из коробки.
