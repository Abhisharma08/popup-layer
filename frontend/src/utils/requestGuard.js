export function createLatestRequestGuard() {
  let latestToken = 0;

  return {
    begin() {
      latestToken += 1;
      return latestToken;
    },
    isCurrent(token) {
      return token === latestToken;
    },
  };
}
