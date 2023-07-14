const fsExtra = require("fs-extra");
const moment = require("moment");
const _ = require("lodash");
const fs = require("fs");
const sharp = require("sharp");
const mergeImg = require("merge-img");
const WordExtractor = require("word-extractor");
const { async } = require("rxjs");

const RGBImages = "C:\\Users\\Duy\\Downloads\\VideoSubFinder\\VideoSubFinder_5.60_x64\\Release_x64\\RGBImages";
const TXTImages = "C:\\Users\\Duy\\Downloads\\VideoSubFinder\\VideoSubFinder_5.60_x64\\Release_x64\\TXTImages";
const TXTResults = "C:\\Users\\Duy\\Downloads\\VideoSubFinder\\VideoSubFinder_5.60_x64\\Release_x64\\TXTResults";
const Subtitle = "C:\\Users\\Duy\\Downloads\\Subtitle";
var convert = require("xml-js");

const setDelayTime = (path, millisecond, line = 0) => {
  if (!path.replace(".srt")) return;
  const arrText = fsExtra.readFileSync(path, "utf8").split("\n");
  const newArrText = [];
  let check = false;
  arrText.forEach((t, index) => {
    const text = t.trim();
    if (!check && text.includes("-->")){
      const tectCheck = Number(arrText[index - 1]);
      if(tectCheck >= line) check = true;
    }
    if (check) {
      if (text.includes("-->")) {
        const [time1, time2] = text.split(" --> ");
        const newTime1 = toTimeStr(toTimeNumber(time1) + millisecond);
        const newTime2 = toTimeStr(toTimeNumber(time2) + millisecond);
        newArrText.push(newTime1 + " --> " + newTime2);
      } else if (text === "") {
        if (!!Number(arrText[index + 1])) {
          newArrText.push(text);
        }
      } else {
        newArrText.push(text);
      }
    } else {
      newArrText.push(text);
    }
  });
  fsExtra.writeFileSync(path, newArrText.join("\r\n"));
};

const toTimeNumber = (str) => {
  let [a, b] = str.split(",");
  let [h, m, s] = a.split(":");
  if (!b) {
    [h, m, s, b] = str.split(":");
  }
  return Number(h) * 3600 * 1000 + Number(m) * 60 * 1000 + Number(s) * 1000 + Number(b);
};

const toTimeStr = (number) => {
  return moment("2023-01-01 00:00:00").add(Number(number), "millisecond").format("HH:mm:ss,SSS");
};

const setDelayAllTime = (path, oldStr, newStr) => {
  const oldSubs = toTimeNumber(oldStr);
  const newSubs = toTimeNumber(newStr);

  const arrText = fsExtra.readFileSync(path, "utf8").split("\n");
  const newArrText = [];
  // let delaytime = 0;
  arrText.forEach((text, index) => {
    if (text.includes("-->")) {
      const [time1, time2] = text.split(" --> ");
      const newTime1 = toTimeStr(toTimeNumber(time1)*newSubs/oldSubs);
      const newTime2 = toTimeStr(toTimeNumber(time2)*newSubs/oldSubs);
      newArrText.push(newTime1 + " --> " + newTime2);
    } else if (text === "") {
      if (!!Number(arrText[index + 1])) {
        newArrText.push(text);
      }
    } else {
      newArrText.push(text);
    }
  });
  fsExtra.writeFileSync(path, newArrText.join("\n"));
};

const createSub = (path, fName) => {
  const txts = fs.readdirSync(TXTResults);
  txts.forEach((txt) => {
    try {
      fsExtra.removeSync(`${TXTResults}\\${txt}`);
    } catch (error) {}
  });

  const arrText = fsExtra.readFileSync(path, "utf8").split("12345678987654321");
  let files = fsExtra.readFileSync(`${Subtitle}\\${fName}\\time.txt`, "utf8").split("\n");
  console.log(arrText.length);

  const subtitleArr = [];
  arrText.forEach((text, index) => {
    if (!_.isEmpty(text.trim())) {
      const times = files[index].split("__");
      const time1s = times[0].split("_");
      const time2s = times[1].split("_");
      if (index > 0 && text.trim() === arrText[index - 1].trim()) {
        const timeTr = subtitleArr[subtitleArr.length - 3];
        subtitleArr[subtitleArr.length - 3] = `${timeTr.split(" --> ")[0]} --> 0${time2s[0]}:${time2s[1]}:${time2s[2]},${time2s[3]}`
      } else {
        subtitleArr.push(index + 1);
        subtitleArr.push(`0${time1s[0]}:${time1s[1]}:${time1s[2]},${time1s[3]} --> 0${time2s[0]}:${time2s[1]}:${time2s[2]},${time2s[3]}`);
        subtitleArr.push(text.trim());
        subtitleArr.push("");
      }
    }
  });
  fsExtra.writeFileSync(`${Subtitle}\\${fName}.srt`, subtitleArr.join("\n"));
};

const createImage = (slipIndex, fName) => {
  let files = fsExtra.readdirSync("./RGBImages" + "\\");
  files.forEach((f) => {
    fsExtra.removeSync("./RGBImages" + `\\` + f);
  });
  const fileDup = fsExtra.readFileSync("./line.jpeg");
  fsExtra.copySync(RGBImages, "./RGBImages", { overwrite: true | false });

  files = fsExtra.readdirSync("./RGBImages");
  fsExtra.outputFile(`${Subtitle}\\${fName}\\time.txt`, files.join("\n"));
  fsExtra.outputFile(`./subtitles/${fName}.txt`, "");

  for (let index = files.length - 2; index >= 0; index--) {
    const name = files[index];
    const nameDup = name.replace(".jpeg", "_1.jpeg");
    fsExtra.outputFileSync("./RGBImages" + `\\` + nameDup, fileDup);
  }
  files = fsExtra.readdirSync("./RGBImages" + "\\");
  _.chunk(files, slipIndex).forEach((newFiles, index) => {
    const fis = newFiles.map((f) => "./RGBImages" + "\\" + f);
    mergeImg(fis, { direction: true })
      .then((img) => {
        img.getBuffer("image/jpeg", (err, buffer) => {
          if (err) throw err;
          sharp(buffer)
            .jpeg({ quality: 80 })
            .toBuffer((err, buffer2) => {
              console.log(err);
              fsExtra.outputFile(`${Subtitle}\\${fName}\\image_${index}.jpeg`, buffer2);
            });
          newFiles.forEach((name) => {
            fsExtra.removeSync("./RGBImages" + `\\` + name);
          });
          console.log("Success!");
        });
      })
      .catch((err) => console.log(err));
  });
};

const replaceText = (path) => {
  const replaces = require("./replace.json");
  let text = fsExtra.readFileSync(path, "utf8");
  [1, 2, 3, 4, 5].forEach((element) => {
    Object.keys(replaces).forEach((key) => {
      const keys = [...replaces[key], ...replaces[key].map((elm) => elm.toLocaleUpperCase())];
      text = text.replace(new RegExp(keys.join("|"), "g"), key);
      text = text.replace("To.", "Ta.");
      text = text.replace("to.", "ta.");
      text = text.replace("|", "");
    });
    fsExtra.writeFileSync(path, text);
  });
};

const covertXmlToJson = (path) => {
  var xml = require("fs").readFileSync(path, "utf8");

  var result = convert.xml2json(xml, { compact: true, spaces: 4 });
  return JSON.parse(result).xml.dia;
};

const covertJsonToSub = () => {
  let files = fsExtra.readdirSync("./xml");
  files.forEach((name) => {
    const path = "./xml/" + name;
    const json = covertXmlToJson(path);
    const subArr = [];
    json.forEach((elm, index) => {
      subArr.push(index + 1);
      const newTime1 = toTimeStr(elm.st._text);
      const newTime2 = toTimeStr(elm.et._text);
      subArr.push(newTime1 + " --> " + newTime2);
      subArr.push(elm.sub._cdata);
      subArr.push("");
    });
    fsExtra.writeFileSync(path.replace(".xml", ".srt"), subArr.join("\n"));
  });
};

const readDocx = () => {
  let files = fsExtra.readdirSync(`${Subtitle}`);
  let folders = files.filter((f) => !f.includes(".srt"));
  folders.forEach(async (f) => {
    files = fsExtra.readdirSync(`${Subtitle}\\${f}`);
    let docxs = files.filter((f) => f.includes(".docx"));
    const strs = await Promise.all(
      docxs.map((docx) => {
        return new Promise((resolve, reject) => {
          const extractor = new WordExtractor();
          const extracted = extractor.extract(`${Subtitle}\\${f}\\${docx}`);
          extracted.then(function (doc) {
            resolve(doc.getBody());
          });
        });
      })
    );
    fsExtra.outputFile(`./subtitles/${f}.txt`, strs.join("\n"));
  });
};

const arg = process.argv[2];
const param1 = process.argv[3];
const param2 = process.argv[4];
const param3 = process.argv[5];

if (arg === "createImage") {
  createImage(350, param1);
} else if (arg === "createSub") {
  let files = fsExtra.readdirSync("./subtitles");
  files.forEach((file) => {
    createSub(`./subtitles/${file}`, file.replace(".txt", ""));
  });
} else if (arg === "replaceText") {
  let files = fsExtra.readdirSync("./subtitles");
  files.forEach((file) => {
    replaceText(`./subtitles/${file}`);
  });
} else if (arg === "setDelayTime") {
  if (param1 && param2) {
    setDelayTime(param1, Number(param2), Number(param3 || 0));
  }
} else if (arg === "setDelayAllTime") {
  if (param1 && param2 && param3) {
    setDelayAllTime(`F:\\XDCYV\\${param1}.srt`, param2, param3);
  }
} else if (arg === "readDocx") {
  readDocx();
} else if (arg === "covertJsonToSub") {
  covertJsonToSub();
}