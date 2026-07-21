export function formatDate(date: string | Date, locale: string) {
  let dateObject: Date;

  if (typeof date === 'string') {
    dateObject = new Date(date);
  } else {
    dateObject = date;
  }

  return dateObject.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}
