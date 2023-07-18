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

const concat = async (path = outputPath) => {
  let files = fs.readdirSync(path);
  const numberConcat = files.length;
  files = _.orderBy(files, (f) => Number(f.replace(/ \(.\)|\.mp4/g, "")));
  let firstFile = Number(files[0].replace(/ \(.\)|\.mp4/g, ""));
  for (let i = 0; i < files.length; i += numberConcat) {
    if (i + numberConcat <= files.length) {
      const arr = [];
      const arrRoot = [];
      const arrPromise = [];
      for (let j = i; j < i + numberConcat; j++) {
        arr.push(`data/${files[j]}.ts`);
        arrRoot.push(`${path}/${files[j]}`);
        arrPromise.push(`ffmpeg -i ${path}/${files[j]} -codec copy data/${files[j]}.ts`);
      }
      // console.log(arrPromise);
      await Promise.all(arrPromise.map((query) => promiseExec(query)));
      const fileOutput = `${fotmatNumber(i + firstFile)}_${fotmatNumber(i + firstFile + numberConcat - 1)}.mp4`;
      const str = `ffmpeg -i concat:${arr.join("|")} -codec copy ${path}/${fileOutput}`;
      console.log(str);
      await promiseExec(str);
      await Promise.all(arr.map((item) => fsExtra.remove(item)));
      // await Promise.all(arrRoot.map((item) => fsExtra.remove(item)));
      console.log("done step");
    }
  }
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
        "zai_did=8k9uAj3FNiTevcSSryzXoYYo643Do6F28xSLGZKn; _ga_TMJX5TWN5E=GS1.1.1689640241.1.0.1689640241.60.0.0; _ga=GA1.2.557473419.1689640241; _gid=GA1.2.123653711.1689640241; _gat_gtag_UA_158812682_2=1; _zlang=vn; __zi=2000.SSZzejyD0jydXQcYsa00d3xBfxgO71AM8Ddbg8uE7SWetAdbYmyKm2VHfA2201c58DEigu06784q.1",
      origin: "https://zalo.ai",
      referer: "https://zalo.ai/products/text-to-audio-converter"
    },
    body: formBody
  })
    .then((response) => {
      return response.json();
    })
    .then((value) => {
      console.log(value);
      return value?.data?.url;
    });
  await new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve();
    }, 500);
  });
  if (!URL) {
    throw "You have exceeded your daily free quota for this demo, please try again tomorrow or contact our support team";
  }
  await promiseExec(`ffmpeg -i ${URL} -c copy -bsf:a aac_adtstoasc ${path}/${fotmatNumber(index)}.mp4`);
  await promiseExec(`ffmpeg -i ${path}/${fotmatNumber(index)}.mp4 ${path}/${fotmatNumber(index)}.mp3`);
  fsExtra.remove(`${path}/${fotmatNumber(index)}.mp4`);
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

const createVodFromSub = async (pathFileSub) => {
  const arrText = fsExtra.readFileSync(pathFileSub, "utf8").split("\n");
  const name = _.replace(_.last(_.split(pathFileSub, "\\")), ".srt", "");
  try {
    fsExtra.mkdirSync("./download/" + _.kebabCase(name));
  } catch (error) {}
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
  const arr2 = [];
  try {
    fsExtra.mkdirSync("./download/" + _.kebabCase(name));
  } catch (error) {}
  // let file = arr.join("\n");
  // do {
  //   const lastIndexN = file.lastIndexOf("\n", 499);
  //   const lastIndexDoc = file.lastIndexOf(".", 499);
  //   const lastIndex = file.length > 500 ? (lastIndexDoc ? lastIndexN : lastIndexDoc) : file.length;
  //   const text = file.substring(0, lastIndex + 1);
  //   arr2.push(text);
  //   file = file.substring(lastIndex, file.length);
  // } while (file.length > 0);
  console.log(arr.length);
  let audios = fsExtra.readdirSync("./download/" + _.kebabCase(name), "utf8").filter((f) => !f.includes("all") && !f.includes("sub"));
  audios = _.orderBy(audios, (o) => Number(o.replace(".mp3", "")));
  console.log(arr.length, audios.length);
  // for (let i = Number(_.last(audios)?.replace(".mp3", "") || -1) + 1; i < arr.length; i++) {
  //   // await downVod(arr[i], i, "./download/" + _.kebabCase(name));
  // }
  for (let i = 0; i < arr.length; i++) {
    const checkItem = audios.find((au) => au.includes(fotmatNumber(i)));
    if (!checkItem) {
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
  let fileAll = audios.find((f) => f.includes("all"));
  audios = _.orderBy(
    audios.filter((f) => !f.includes("all") && !f.includes("sub")),
    (o) => Number(o.replace(".mp3", ""))
  );
  if (arr.length !== audios.length) {
    console.error("ERROR: ", arr.length, audios.length);
    return;
  }
  const index = Number(fileAll.replace(".mp3", "").split("_")[1] || -1);
  const options = [];
  for (let i = 0; i < audios.length; i++) {
    const audio = audios[i];
    const newTime = arr[i] / 1000;
    const audioFile = fs.readFileSync(path + "/" + audio);
    const option = _.last(options);
    const time = (option && option.time + option.cast > newTime ? option.time + option.cast : newTime) - 0.2;
    options.push({ name: audio, time: _.ceil(time, 3), cast: getMP3Duration(audioFile) / 1000 });
  }
  // console.log(options);
  const chunkOptions = _.chunk(options, 200);
  for (let j = 0; j < chunkOptions.length; j++) {
    const newOptions = chunkOptions[j];
    const pathFileSave = j === chunkOptions.length - 1 ? pathFileSub.replace(".srt", ".mp3") : `${path}/sub${fotmatNumber(j)}.mp3`;
    // console.log(newOptions);
    const query = `ffmpeg -i ${path}/all.mp3 ${newOptions.map((o) => `-i ${path}/${o.name}`).join(" ")}${
      j > 0 ? ` -i ${path}/sub${fotmatNumber(j - 1)}.mp3` : ""
    } -filter_complex "${newOptions
      .map(
        (o, i) =>
          `[${i === 0 ? (j === 0 ? "0:a" : `${newOptions.length + 1}:a`) : `c${i - 1}`}]atrim=0:${o.time}[a${i}];[0:a]atrim=0:${_.ceil(
            (newOptions[i + 1]?.time || o.time) - o.time + 10,
            3
          )}[b${i}];[a${i}][${i + 1}:a][b${i}]concat=n=3:v=0:a=1[c${i}]`
      )
      .join(";")}" -map "[c${newOptions.length - 1}]" ${pathFileSave}`;
    // console.log(query);
    await promiseExec(query);
    await new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve();
      }, 500);
    });
  }

  //  const query = `ffmpeg -i ${path}/all.mp3  ${newOptions.map((o) => `-i ${path}/${o.name}`).join(" ")}${
  //   index > 0 ? ` -i sub${fotmatNumber(index - 1)}.mp3` : ""
  // } -filter_complex "${newOptions
  //   .map(
  //     (o, i) =>
  //       `[${i === 0 ? (index === 0 ? "0:a" : `${i + 2}:a`) : `c${i - 1}`}]atrim=0:${o.time}[a${i}];[0:a]atrim=0:${_.ceil(
  //         (newOptions[i + 1]?.time || o.time) - o.time + 10,
  //         3
  //       )}[b${i}];[a${i}][${i + 1}:a][b${i}]concat=n=3:v=0:a=1[c${i}]`
  //   )
  //   .join(";")}" -map "[c${newOptions.length - 1}]" ${path}/sub${fotmatNumber(index)}.mp3`;

  // const query = `ffmpeg -i ${path}/all.mp3 ${options.map((o) => `-i ${path}/${o.name}`).join(" ")} -filter_complex "${options
  //   .map(
  //     (o, i) =>
  //       `[${i === 0 ? "0:a" : `c${i - 1}`}]atrim=0:${o.time}[a${i}];[0:a]atrim=0:${_.ceil((options[i + 1]?.time || o.time) - o.time + 10, 3)}[b${i}];[a${i}][${
  //         i + 1
  //       }:a][b${i}]concat=n=3:v=0:a=1[c${i}]`
  //   )
  //   .join(";")}" -map "[c${options.length - 1}]" ${path}/all_.mp3`;
  // console.log(query);
  // await promiseExec(query);
};

const createVodFromText = async (pathFileSub) => {
  const name = _.replace(_.last(_.split(pathFileSub, "\\")), ".txt", "");
  const arr = [];
  try {
    fsExtra.mkdirSync("./download/" + _.kebabCase(name));
  } catch (error) {}
  do {
    const lastIndexN = file.lastIndexOf("\n", 500);
    const lastIndexDoc = file.lastIndexOf(".", 500);
    const lastIndex = file.length > 500 ? (lastIndexDoc ? lastIndexN : lastIndexDoc) : file.length;
    const text = file.substring(0, lastIndex + 1);
    arr.push(text);
    file = file.substring(lastIndex, file.length);
  } while (file.length > 0);
  for (let i = 0; i < arr.length; i++) {
    await downVod(arr[i], i, "./download/" + _.kebabCase(name));
  }
  // await concat('./download/' + name)
};
// createVodFromText("F:\\Battle Through The Heavens 5 - 52.srt");

// concatVod("./Battle Through The Heavens 5 - 52.srt");

const arg = process.argv[2];
const param1 = process.argv[3];
const param2 = process.argv[4];
const param3 = process.argv[5];

if (arg === "create") {
  createVodFromSub(param1);
} else if (arg === "concat") {
  concatVod(param1);
}

const splitGroup = async (path, name) => {
  const g000 = {
    g000: [1.6, 3.4, 6.1, 7.3, 9.6, 11.7, 13.2, 15.8, 17.8, 19.7, 21.4, 23.22, 25.8, 29.4, 31.3, 32.9, 35, 37.6],
    g001: [3.1, 5, 6.5, 9.2, 11.8, 13.4, 16.3, 17.4, 19.7, 21.4, 23.8, 24.9, 27.8, 29.3, 31, 34.9],
    g002: [1.7, 4, 6.8, 10.2, 12.4, 15.1, 17.1, 20.1, 22.6, 24, 26.2, 28.5, 31.2, 33.3],
    g003: [2.3, 4.2, 5.7, 7.1, 9.2, 10.9, 12.9, 14.2, 16.7, 18, 21, 22.4, 25.1, 27, 29.5, 31.6, 33],
    g004: [3.1, 5, 8.2, 9.9, 11.8, 14.1, 16.7, 18.4, 21.6, 25.1, 26.5, 28.1, 30.8, 32.5, 33.9, 36.2],
    g005: [1.5, 3.4, 4.6, 7.4, 10.4, 13, 15.5, 18.2, 21.2, 23.1, 24.5, 26.5, 28.4, 31.3, 33.2, 34.5, 36.2],
    g006: [2.3, 4.8, 6.1, 8.3, 9.7, 11.5, 14.6, 16.2, 17.7, 19.5, 23.9, 26.6, 28.1, 29.3, 31.5, 32.7, 35.1, 36.4],
    g007: [3]
  };
  const array = g000[name.replace(".mp3", "")];
  for (let i = 0; i <= array.length; i++) {
    const ssTime = i === 0 ? `-ss 00:00:00` : `-ss ${toTimeStr(array[i - 1] * 1000 + 400)}`;
    const toTime = i === array.length ? "" : `-to ${toTimeStr(array[i] * 1000)}`;
    console.log(`ffmpeg -i ${path}/${name} ${ssTime} ${toTime} -c copy ${path}/${fotmatNumber(i + 116)}.mp3`);
    await promiseExec(`ffmpeg -i ${path}/${name} ${ssTime} ${toTime} -c copy ${path}/${fotmatNumber(i + 116)}.mp3`);
  }
};
// splitGroup("./download/thegioi-119", "g007.mp3");

// const arr2 = [1.6, 3.4, 6.1, 7.3, 9.6, 11.7, 13.2, 15.8, 17.8, 19.7, 21.4, 23.22, 25.8, 29.4, 31.3, 32.9, 35, 37.6];
