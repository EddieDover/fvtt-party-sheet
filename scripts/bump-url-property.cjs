module.exports = function (property) {
  return {
    readVersion(contents) {
      const json = JSON.parse(contents);
      const match = json[property].match(/(\d+\.\d+\.\d+)/);
      return match ? match[1] : undefined;
    },
    writeVersion(contents, version) {
      const json = JSON.parse(contents);
      json[property] = json[property].replace(/\d+\.\d+\.\d+/, version);
      return JSON.stringify(json, null, 2) + "\n";
    },
  };
};
