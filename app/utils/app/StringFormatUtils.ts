const validateEmail = (value: string) => {
  return /^\w+([\\.-]?\w+)*@\w+([\\.-]?\w+)*(\.\w{2,3})+$/.test(value);
};

const validateUrl = (value: string) => {
  return /^(?:(ftp|http|https)?:\/\/)?(?:[\w-]+\.)+([a-z]|[A-Z]|[0-9]){2,}(?:\/.*)?$/gi.test(value);
};

const validatePhone = (value: string) => {
  return /^\+?(\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}$/.test(value);
};

export default {
  validateEmail,
  validateUrl,
  validatePhone,
};
