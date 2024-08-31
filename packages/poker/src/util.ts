export const rotateArrayLeft = <T>(arr: T[], n: number) => {
  if (n < 0) {
    n = arr.length + n;
  }
  n = n % arr.length;
  const copy = arr.slice();
  return copy.splice(n).concat(copy);
};
