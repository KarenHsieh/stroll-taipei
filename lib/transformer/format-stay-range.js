function hourify(minutes) {
  const hours = minutes / 60;
  if (Number.isInteger(hours)) {
    return String(hours);
  }
  return hours.toFixed(1).replace(/\.0$/, "");
}

export function formatStayRange([min, max]) {
  if (max < 60) {
    return `約 ${min} 到 ${max} 分鐘`;
  }
  if (max === 60 && min < 60) {
    return `約 ${min} 分鐘到 1 小時`;
  }
  return `約 ${hourify(min)} 到 ${hourify(max)} 小時`;
}
