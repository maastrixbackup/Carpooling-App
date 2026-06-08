const colors = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
  magenta: "\x1b[35m",
};

export const logger = {
  request(url: string, method: string, payload?: any) {
    console.log(`${colors.cyan}[API REQUEST]${colors.reset}`, method, url);

    if (payload) {
      console.log(`${colors.blue}[REQUEST BODY]${colors.reset}`, payload);
    }
  },

  response(url: string, data: any) {
    console.log(`${colors.green}[API SUCCESS]${colors.reset}`, url);

    console.log(data);
  },

  error(url: string, error: any) {
    console.log(`${colors.red}[API ERROR]${colors.reset}`, url);

    console.log(error);
  },

  auth(message: string, data?: any) {
    console.log(`${colors.magenta}[AUTH]${colors.reset}`, message);

    if (data) {
      console.log(data);
    }
  },
};
