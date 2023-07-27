const _ = require("lodash");
const fs = require("fs");
let fetch = require("node-fetch");
const FormData = require("form-data");
const fsExtra = require("fs-extra");
const { spawn, exec } = require("child_process");
const inputPath = "C:\\Users\\Duy\\Desktop\\folder2";
const outputPath = "C:\\Users\\Duy\\Desktop\\folder";
const numberConcat = 10;
const from = "00:02:00";
const moment = require("moment");
const to = "00:07:00";
const getMP3Duration = require("get-mp3-duration");

const fotmatNumber = (number) => {
  if (number < 10) {
    return `00${number}`;
  } else if (number < 100) {
    return `0${number}`;
  } else {
    return `${number}`;
  }
};

const promiseExec = (query) => {
  return new Promise((resolve, reject) => {
    const ffmpeg = spawn(
      "ffmpeg",
      query
        .replace("ffmpeg ", "")
        .split(" ")
        .map((i) => _.trim(i, '"'))
    );
    ffmpeg.stdout.on("data", (data) => {
      console.log(`stdout: ${data}`);
    });
    ffmpeg.stderr.on("data", (data) => {
      console.error(`stderr: ${data}`);
    });
    ffmpeg.on("close", (code) => {
      console.log(`child process exited with code ${code}`);
      resolve(code);
    });
  });
};

const covertVideo = async () => {
  const files = fs.readdirSync(inputPath);
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const newfile = file.replace(/ \(.\)|-freedownloadvideo.net/g, "");
    await promiseExec(`ffmpeg -i ${inputPath + "\\" + file} -ss ${from} -to ${to} -c copy ${outputPath + "\\" + newfile}`);
  }
};

const concat = async (inputPath) => {
  const name = _.replace(_.last(_.split(inputPath, "/")), ".txt", "");
  const path = "./download/" + _.kebabCase(name);
  let audios = fsExtra.readdirSync(path, "utf8").filter(f => !f.includes('all'));
  const str = `ffmpeg -i concat:${audios.map(file => path + '/' + file).join("|")} -codec copy ${path}/${name}.mp3`;
  await promiseExec(str);
};

const donwloadVideo = async (link, array, name = "") => {
  const arr = array.split(",");
  console.log(arr);
  await Promise.all(
    arr.map((i) => {
      const query = `ffmpeg -i ${link.replace(new RegExp(":i", "g"), i)} -c copy -bsf:a aac_adtstoasc ${outputPath}\\${name}${i}.mp4`;
      return promiseExec(query);
    })
  );
};

const reName = async () => {
  const path = "F:\\XDCYV";
  const files = fs.readdirSync(path).filter((f) => f.includes(".mp4") && f.includes(".HD1080p"));
  console.log(files);
  files.forEach((file, i) => {
    const index = i + 9;
    const name = `${index + 1 < 10 ? "0" : ""}${index + 1}.mp4`;
    fs.renameSync(path + "\\" + file, path + "\\" + name);
  });
};
const downVod = async (item, index, path) => {
  console.log(item, index);
  var details = {
    input: item,
    speaker_id: 4,
    speed: 1,
    dict_id: 0,
    quality: 1
  };

  var formBody = [];
  for (var property in details) {
    var encodedKey = encodeURIComponent(property);
    var encodedValue = encodeURIComponent(details[property]);
    formBody.push(encodedKey + "=" + encodedValue);
  }
  formBody = formBody.join("&");
  console.log(formBody);
  const URL = await fetch("https://zalo.ai/api/demo/v1/tts/synthesize", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
      cookie:
        "zai_did=8k9uAj3FNiTevcSSryzXoYYo6474ocB18BOUGpao; __zi=2000.SSZzejyD0jydXQcYsa00d3xBfxgO71AM8Ddbg8uE7SWetAlXZmWMpY_QeQwA2ns2AjcgfeuD688t.1; _zlang=vn; _gid=GA1.2.1307921538.1690452804; _gat_gtag_UA_158812682_2=1; _ga_TMJX5TWN5E=GS1.1.1690452803.1.1.1690452833.30.0.0; _ga=GA1.1.2048792772.1690452804",
      origin: "https://zalo.ai",
      referer: "https://zalo.ai/products/text-to-audio-converter"
    },
    body: formBody
  })
    .then((response) => {
      return response.json();
    })
    .then((value) => {
      return value?.data?.url;
    });
  // await new Promise((resolve, reject) => {
  //   setTimeout(() => {
  //     resolve();
  //   }, 1000);
  // });
  if (!URL) {
    throw "You have exceeded your daily free quota for this demo, please try again tomorrow or contact our support team";
  }
  console.log(URL);
  return URL;
  // await promiseExec(`ffmpeg -i ${URL} -c copy -bsf:a aac_adtstoasc ${path}/${fotmatNumber(index)}.mp4`);
  // await promiseExec(`ffmpeg -i ${path}/${fotmatNumber(index)}.mp4 ${path}/${fotmatNumber(index)}.mp3`);
  // fsExtra.remove(`${path}/${fotmatNumber(index)}.mp4`);
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
  return moment("2023-01-01 00:00:00").add(Number(number), "millisecond").format("HH:mm:ss.SS");
};

const createVodFromSub = async (pathFileSub, arrayStr) => {
  const arrText = fsExtra.readFileSync(pathFileSub, "utf8").split("\n");
  const name = _.replace(_.last(_.split(pathFileSub, "/")), ".srt", "");
  try {
    fsExtra.mkdirSync("./download/" + _.kebabCase(name));
  } catch (error) { }
  const arr = [];
  arrText.forEach((t, index) => {
    if (t.includes("-->")) {
      const str = [arrText[index + 1], arrText[index + 2]].join("\n").trim();
      arr.push(str);
    }
  });
  try {
    fsExtra.readFileSync(`./download/${_.kebabCase(name)}/all.mp3`);
  } catch (error) {
    const time = _.findLast(arrText, (t) => t.includes("-->"));
    const newTime = toTimeStr(toTimeNumber(time.split(" --> ")[1]) + 10000);
    await promiseExec(`ffmpeg -f lavfi -i anullsrc=r=44100:cl=mono -t ${newTime} -q:a 9 -acodec libmp3lame ./download/${_.kebabCase(name)}/all.mp3`);
  }
  try {
    fsExtra.mkdirSync("./download/" + _.kebabCase(name));
  } catch (error) { }
  console.log(arr.length);
  let audios = fsExtra.readdirSync("./download/" + _.kebabCase(name), "utf8").filter((f) => !f.includes("all") && !f.includes("sub"));
  audios = _.orderBy(audios, (o) => Number(o.replace(".mp3", "")));
  console.log(arr.length, audios.length);
  const array = arrayStr && arrayStr.split(',').map(a => Number(a));
  for (let i = 0; i < arr.length; i++) {
    const checkItem = audios.find((au) => au.includes(fotmatNumber(i)));
    if (!checkItem && (!array || array.includes(i))) {
      await downVod(arr[i], i, "./download/" + _.kebabCase(name));
    }
  }
};

const concatVod = async (pathFileSub) => {
  const arrText = fsExtra.readFileSync(pathFileSub, "utf8").split("\n");
  const name = _.replace(_.last(_.split(pathFileSub, "\\")), ".srt", "");
  const arr = [];
  arrText.forEach((t) => {
    if (t.includes("-->")) {
      const newTime = toTimeNumber(t.split(" --> ")[0]);
      arr.push(newTime);
    }
  });
  const path = "./download/" + _.kebabCase(name);
  let audios = fsExtra.readdirSync(path, "utf8");
  audios = _.orderBy(
    audios.filter((f) => !f.includes("all") && !f.includes("sub")),
    (o) => Number(o.replace(".mp3", ""))
  );
  if (arr.length !== audios.length) {
    console.error("ERROR: ", arr.length, audios.length);
    return;
  }
  const options = [];
  console.log(arr);
  for (let i = 0; i < audios.length; i++) {
    const audio = audios[i];
    const newTime = arr[i] / 1000;
    const audioFile = fs.readFileSync(path + "/" + audio);
    const option = _.last(options);
    const castTime = option ? option.time + option.cast : 0;
    const time = (option && (castTime > newTime) ? castTime : newTime) - 0.2;
    options.push({ name: audio, time: _.ceil(time, 3), cast: getMP3Duration(audioFile) / 1000 });
  }
  const chunkOptions = _.chunk(options, 200);
  for (let j = 0; j < chunkOptions.length; j++) {
    const newOptions = chunkOptions[j];
    const pathFileSave = j === chunkOptions.length - 1 ? pathFileSub.replace(".srt", ".mp3") : `${path}/sub${fotmatNumber(j)}.mp3`;
    const query = `ffmpeg -i ${path}/all.mp3 ${newOptions.map((o) => `-i ${path}/${o.name}`).join(" ")}${j > 0 ? ` -i ${path}/sub${fotmatNumber(j - 1)}.mp3` : ""
      } -filter_complex "${newOptions
        .map(
          (o, i) =>
            `[${i === 0 ? (j === 0 ? "0:a" : `${newOptions.length + 1}:a`) : `c${i - 1}`}]atrim=0:${o.time}[a${i}];[0:a]atrim=0:${_.ceil(
              (newOptions[i + 1]?.time || o.time) - o.time + 10,
              3
            )}[b${i}];[a${i}][${i + 1}:a][b${i}]concat=n=3:v=0:a=1[c${i}]`
        )
        .join(";")}" -map "[c${newOptions.length - 1}]" ${pathFileSave}`;
    await promiseExec(query);
    await new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve();
      }, 500);
    });
  }
};

const createVodFromText = async (pathFileSub) => {
  const name = _.replace(_.last(_.split(pathFileSub, "/")), ".txt", "");
  let file = fsExtra.readFileSync(pathFileSub, "utf8");
  fsExtra.mkdirsSync("./download/" + _.kebabCase(name));
  const arr = [];
  try {
    fsExtra.mkdirSync("./download/" + _.kebabCase(name));
  } catch (error) { }
  do {
    const lastIndexN = file.lastIndexOf("\n", 499);
    const lastIndexDoc = file.lastIndexOf(".", 499);
    const lastIndexP = file.lastIndexOf(",", 499);
    let lastIndex = file.length > 500 ? _.max([lastIndexN, lastIndexDoc, lastIndexP]) : file.length;
    const text = file.substring(0, lastIndex + 1).trim();
    const lastIndexbang = text.indexOf("===========");
    if (lastIndexbang >= 0) {
      arr.push(file.substring(0, lastIndexbang).trim());
      arr.push(null);
      lastIndex = lastIndexbang + 10;
    } else {
      arr.push(file.substring(0, lastIndex + 1).trim());
    }
    file = file.substring(lastIndex + 1, file.length).trim();
  } while (file.length > 0);

  let audios = fsExtra.readdirSync("./download/" + _.kebabCase(name), "utf8").filter((f) => !f.includes("all") && !f.includes("sub"));
  audios = _.orderBy(audios, (o) => Number(o.replace(".mp3", "")));
  console.log(arr.length, audios.length);
  const m3u8List = [];
  try {
    for (let i = 0; i < arr.length; i++) {
      const checkItem = audios.find((au) => au.includes(fotmatNumber(i)));
      if (!checkItem) {
        if (arr[i]) {
          const url = await downVod(arr[i], i, "./download/" + _.kebabCase(name));
          m3u8List.push({ index: i, url })
        } else {
          fs.copyFileSync('rong.mp3', `./download/${_.kebabCase(name)}/${fotmatNumber(i)}.mp3`);
        }
      }
    }
  } catch (error) { }
  await new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve();
    }, 1000);
  });
  await Promise.all(m3u8List.map(async (m3u8) => {
    await promiseExec(`ffmpeg -i ${m3u8.url} -c copy -bsf:a aac_adtstoasc ./download/${_.kebabCase(name)}/${fotmatNumber(m3u8.index)}.mp4`);
    await promiseExec(`ffmpeg -i ./download/${_.kebabCase(name)}/${fotmatNumber(index)}.mp4 ./download/${_.kebabCase(name)}/${fotmatNumber(m3u8.index)}.mp3`);
    fsExtra.remove(`./download/${_.kebabCase(name)}/${fotmatNumber(m3u8.index)}.mp4`);
  }));
};

const clean = async (path) => {
  let files = fsExtra.readdirSync(path);
  files.forEach((file) => {
    const replaces = {
      '': ['\\*', '\~', '-', '\\(1\\)', '\\(2\\)', '\\(3\\)', '\\(4\\)', '\\(5\\)', '\\(6\\)', '\\(7\\)'],
      '\.': ['[.]{2,}', '…'],
      '\n': ['\n\n', '\n\.\n'],
      '"': ['”'],
      ',': ['–', '-'],
      'nói, "': ['nói "'],
      'hỏi, "': ['hỏi "'],
      'mở miệng, "': ['mở miệng "'],
      'nói tiếp, "': ['nói tiếp "']
    };
    let text = fsExtra.readFileSync(`${path}/${file}`, "utf8");

    console.log(`${path}/${file}`, text);
    [1, 2, 3, 4, 5].forEach((element) => {
      Object.keys(replaces).forEach((key) => {
        const keys = [...replaces[key], ...replaces[key].map((elm) => elm.toLocaleUpperCase())];
        text = text.replace(new RegExp(keys.join("|"), "g"), key);
      });
      fsExtra.writeFileSync(`${path}/${file}`, text);
    });
  });
};


const arg = process.argv[2];
const param1 = process.argv[3];
const param2 = process.argv[4];
const param3 = process.argv[5];

if (arg === "create") {
  createVodFromSub(param1, param2);
} else if (arg === "create-text") {
  createVodFromText(param1);
} else if (arg === "concat") {
  concatVod(param1);
} else if (arg === "concat-text") {
  concat(param1);
} else if (arg === "clean") {
  clean(param1);
}


