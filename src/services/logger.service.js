import Config from "config";

export default {
    showLog: (data) => {
      if (Config.log) { // we change this to environment specific
        if (typeof (data) === 'string') {
          console.log(data);
        } else {
          console.log(...data);
        }
      }
    }
};