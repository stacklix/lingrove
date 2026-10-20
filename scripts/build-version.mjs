// Share one build date across all modules and both publication channels.
export function moduleBuildVersion(now = new Date()) {
  const value = process.env.MODULE_BUILD_VERSION || new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(now).replaceAll('-', '');
  const iso = `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`;
  const date = new Date(`${iso}T00:00:00Z`);
  if (!/^[0-9]{8}$/.test(value) || value.startsWith('0000') || Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== iso) {
    throw new Error('MODULE_BUILD_VERSION must be a valid yyyyMMdd date');
  }
  return value;
}
