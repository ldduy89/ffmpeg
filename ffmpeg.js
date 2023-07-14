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
var mp3Duration = require("mp3-duration");

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

const arg = process.argv[2];
const param1 = process.argv[3];
const param2 = process.argv[4];
const param3 = process.argv[5];

if (arg === "donwload") {
  donwloadVideo(param1, param2, param3);
}

const downVod = async (item, index, path) => {
  console.log(item, index);
  var details = {
    input: item,
    speaker_id: 1,
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
        "zai_did=8k9uAj3FNiTevcSSryzXoYYo643Dp6B4AROPGZGo; _ga_TMJX5TWN5E=GS1.1.1689256865.1.0.1689256865.60.0.0; _ga=GA1.2.586266749.1689256865; _gid=GA1.2.868345203.1689256865; _gat_gtag_UA_158812682_2=1; __zi=2000.SSZzejyD0jydXQcYsa00d3xBfxgO71AM8Ddbg8uE7SWetAZbZmCPoIdIgwcC0nQCAj6bg8WE68Cu.1; _zlang=vn",
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
  await promiseExec(`ffmpeg -i ${URL} -c copy -bsf:a aac_adtstoasc ${path}/${index < 10 ? `00${index}` : index < 100 ? `0${index}` : index}.mp4`);
};

const stringNumber = (index) => {
  return `${index < 10 ? `000${index}` : index < 100 ? `00${index}` : index < 1000 ? `0${index}` : index}`;
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
    await promiseExec(`ffmpeg -f lavfi -i anullsrc=r=44100:cl=mono -t 00:10:00 -q:a 9 -acodec libmp3lame out.mp3`);
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

  let audios = fsExtra.readdirSync("./download/" + _.kebabCase(name), "utf8").filter((f) => !f.includes("all"));
  audios = _.orderBy(audios, (o) => Number(o.replace(".mp4", "")));
  // for (let i = Number(_.last(audios)?.replace('.mp4', '') || -1) + 1; i < arr.length; i++) {
  //   await downVod(arr[i], i, './download/' + _.kebabCase(name));
  // }

  // for (let i = 63; i < 64; i++) {
  //   await downVod(arr[i], i, './download/' + _.kebabCase(name));
  // }
};
// createVodFromSub("F:\\Battle Through The Heavens 5 - 52.srt");

const concatVod = async (pathFileSub) => {
  const arrText = fsExtra.readFileSync(pathFileSub, "utf8").split("\n");
  const name = _.replace(_.last(_.split(pathFileSub, "\\")), ".srt", "");
  const arr = [];
  arrText.forEach((t, index) => {
    if (t.includes("-->")) {
      const newTime = toTimeNumber(t.split(" --> ")[0]);
      // console.log(newTime);
      // const str = [arrText[index + 1], arrText[index + 2]].join("\n").trim();
      arr.push(newTime);
    }
  });
  const path = "./download/" + _.kebabCase(name);
  let audios = fsExtra.readdirSync(path, "utf8");
  let fileAll = audios.find((f) => f.includes("all"));
  audios = _.orderBy(
    audios.filter((f) => !f.includes("all")),
    (o) => Number(o.replace(".mp3", ""))
  );
  const index = Number(fileAll.replace(".mp3", "").split("_")[1] || -1);
  let nextAll = fileAll;
  const options = [];
  for (let i = index + 1; i < audios.length; i++) {
    const audio = audios[i];
    const newTime = arr[i];
    const audioFile = fs.readFileSync(path + "/" + audio);
    const option = _.last(options);
    // console.log( Number(newTime),Number(option?.end || 0),Number(newTime) -  Number(option?.end || 0));
    const delay = Number(newTime) - Number(option?.end || 0) + 50;
    options.push({
      name: audio,
      delay: delay < 0 ? 0 : delay,
      cast: getMP3Duration(audioFile),
      newTime,
      end: (delay < 0 ? Number(option?.end || 0) : newTime) + getMP3Duration(audioFile)
    });
  }
  // console.log(options)
  // console.log(`ffmpeg -i ${path}/all.mp3 ${options.map(o => `-i ${path}/${o.name}`).join(' ')} -filter_complex "${options.map((o, i) => `[0:a]atrim=end=${o.delay/1000}[b${i}];[${i+1}:a]asetpts=[i${i}]`).join(';')};[0:a]atrim=start=${_.last(options).end/1000}[b${options.length}];${options.map((o, i) => `[b${i}][i${i}]`).join('')}[b${options.length}]concat=n=${options.length*2 +1}:v=0:a=1" ${path}/all_.mp3`);
  await promiseExec(`ffmpeg -i ${path}/all.mp3 ${options.map(o => `-i ${path}/${o.name}`).join(' ')} -filter_complex "${options.map((o, i) => `[0:a]atrim=end=${o.delay/1000}[b${i}];[${i+1}:a]asetpts=[i${i}]`).join(';')};[0:a]atrim=start=${_.last(options).end/1000}[b${options.length}];${options.map((o, i) => `[b${i}][i${i}]`).join('')}[b${options.length}]concat=n=${options.length*2 +1}:v=0:a=1" ${path}/all_.mp3`)
  // const opto
  for (let i = index + 1; i < audios.length; i++) {
    const audio = audios[i];
    // const newTime = arr[i];
    // const audioFile = fs.readFileSync(path+'/'+audio);
    // await promiseExec(`ffmpeg -i ${path}/${audio} ${path}/${audio.replace('mp4','mp3')}`)
    // console.log(audio, getMP3Duration(audioFile), 'ms');
    // console.log(`ffmpeg -i ${path}/all.mp3 -i ${path}/${audio} -filter_complex "[0:a]atrim=end=35[a];[1:a]asetpts=[b];[0:a]atrim=start=35[c];[a][b][c]concat=n=3:v=0:a=1[out]" -map "[out]" ${path}/output.mp3`);
    // await promiseExec(`ffmpeg -i ${path}/${nextAll} -i ${path}/${audio} -filter_complex "[0:a]atrim=end=${newTime}[a];[1:a]asetpts=[b];[0:a]atrim=start=${newTime+0.1}[c];[a][b][c]concat=n=3:v=0:a=1" ${path}/all_${stringNumber(i)}.mp3`);
    // console.log(stringNumber(i));
    // fsExtra.removeSync(`${path}/${nextAll}`);
    // nextAll = `all_${stringNumber(i)}.mp3`;
    // console.log('remove', fileAll)
    // fs.renameSync(`${path}/output.mp3`,`${path}/all_${stringNumber(i)}.mp3`);
    // await new Promise((resolve, reject) => {
    //   setTimeout(() => {
    //     resolve();
    //   }, 5000);
    // });
  }
};
concatVod("F:\\Battle Through The Heavens 5 - 52.srt");

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
