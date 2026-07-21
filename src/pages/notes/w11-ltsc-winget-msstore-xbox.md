---
layout: '@layouts/BlogPostLayout.astro'
title: 'Установка WinGet, Microsoft Store и сервисов Xbox на Windows 11 LTSC'
date: '2026-07-21'
---

Windows 11 LTSC - редакция с минимальным комплектом поставки, в которой не только нет приложений типа Clipchamp, Bing News и Teams, но и важных для повседневного использования компонентов: App Installer (WinGet), Microsoft Store и сервисов Xbox. К счастью, их можно вернуть стандартными средствами от Microsoft.

## Установка WinGet (App Installer)

### Способ 1: Через PowerShell модуль (самый быстрый и простой)

[Официальный модуль WinGet для PowerShell от Microsoft](https://www.powershellgallery.com/packages/Microsoft.WinGet.Client/) позволяет не только пользоваться самим WinGet, но и устанавливать его, если его нет в системе.

В PowerShell от администратора:

Установить модуль (в процессе может потребоваться два раза нажать Y, чтобы добавить NuGet и довериться PSGallery):

```powershell
Install-Module -Name Microsoft.WinGet.Client
```

Затем установка самого WinGet. Установить для текущего пользователя:

```powershell
Repair-WinGetPackageManager -Force -Latest
```

Установить для всей системы:

```powershell
Repair-WinGetPackageManager -Force -Latest -AllUsers
```

### Способ 2: Вручную

Со [страницы последнего стабильного релиза winget-cli](https://github.com/microsoft/winget-cli/releases/latest) понадобятся следующие файлы:

- Microsoft.DesktopAppInstaller_8wekyb3d8bbwe.msixbundle
- DesktopAppInstaller_Dependencies.zip
- ..._License1.xml (нужен, если требуется установить для всей системы, а не только для текущего пользователя)

В PowerShell от администратора в директории с данными файлами:

Распаковать архив:

```powershell
Expand-Archive -Path .\DesktopAppInstaller_Dependencies.zip -DestinationPath .
```

Установить для текущего пользователя:

```powershell
# Установка зависимостей. Заменить x64 на свою архитектуру, если нужно
Get-ChildItem .\x64\*.appx | Add-AppxPackage

Add-AppxPackage -Path ".\Microsoft.DesktopAppInstaller_8wekyb3d8bbwe.msixbundle"
```

Установить для всей системы:

```powershell
# Установка зависимостей и App Installer. Заменить x64 на свою архитектуру, если нужно
Add-AppxProvisionedPackage -Online `
  -PackagePath ".\Microsoft.DesktopAppInstaller_8wekyb3d8bbwe.msixbundle" `
  -DependencyPackagePath (Get-ChildItem .\x64\*.appx).FullName `
  -LicensePath (Get-ChildItem .\*_License1.xml).FullName
```

## Установка Microsoft Store

Microsoft Store в целом необязателен: WinGet по умолчанию имеет источник `msstore`, из которого можно установить бесплатные приложения. Однако Store нужен, если требуется автообновление UWP-приложений, покупка и установка платных приложений, или просто удобный GUI.

Установить можно одной командой в терминале от администратора:

```powershell
wsreset -i
```

Она не даёт никакого визуального фидбека и может занимать разное количество времени на каждой машине. После завершения её работы ярлык Microsoft Store появится в пуске. Обычно занимает меньше минуты, в крайнем случае - 10-15 минут.

## Установка сервисов Xbox

Иногда сервисы Xbox нужны играм и приложениям для корректной работы. Список пакетов можно разделить на две категории:

**Обязательные** (могут потребовать даже игры из Steam):

- **Microsoft.XboxIdentityProvider** - авторизация в Xbox Live
- **Microsoft.Xbox.TCUI** - интерфейс для авторизации и социальных функций (окна, которые может вызывать сама игра)
- **Microsoft.XboxGameCallableUI** - уже есть в системе даже на LTSC, примерно то же самое, что и TCUI

**Необязательные** (для игр из Store/Xbox):

- **Microsoft.GamingServices** - проверка лицензий и запуск игр из Microsoft Store/Xbox
- **Microsoft.GamingApp (Xbox)** - используется только как стор/лаунчер, уже установленные игры должны работать и без него
- **Microsoft.XboxGamingOverlay (Game Bar)** - оверлей с записью и FPS, если не ставить, будет появляться навязчивое окно "Вам понадобится новое приложение" при каждом запуске любой игры.

Единственный рабочий способ, который я нашёл, - использование **Gaming Services Repair Tool**. Он установит все компоненты сразу (и обязательные, и необязательные), поэтому список выше не имеет никакого смысла. Установить из WinGet:

```powershell
winget install Microsoft.Gaming.GamingServicesRepairTool
```

Программа добавится в PATH, не создавая ярлыка в пуске. Чтобы её запустить, нужно открыть новое окно терминала (чтобы подхватился обновлённый PATH) и прописать:

```
gamingrepairtool
```

Начнётся установка пакетов Xbox. Когда установка завершится, программа спросит, решены ли все проблемы. Нужно подтвердить нажатием `Y`.
