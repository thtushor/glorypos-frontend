export const getCookiesAsObject = () => {
  return document.cookie.split(";").reduce((cookies, cookie) => {
    const [name, value] = cookie.split("=").map((c) => c.trim());
    cookies[name] = decodeURIComponent(value);
    return cookies;
  }, {} as Record<string, string>);
};
