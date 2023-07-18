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

const covertVideo = async (path, from, to) => {
  try {
    fsExtra.mkdirSync(path + '\\covert');
  } catch (error) {}
  const files = fs.readdirSync(path).filter(f => f !== 'covert');
  const covertFiles = fs.readdirSync(path + '\\covert');
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const newfile = file.replace(/ \(.\)|-freedownloadvideo.net/g, "");
    if (!covertFiles.find(f => f === newfile)) {
      await promiseExec(`ffmpeg -i ${path + "\\" + file} -ss ${from} -to ${to} -c copy ${path + '\\covert\\' + newfile}`);
    }
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

if (arg === "covert") {
  covertVideo(param1, param2, param3);
} else if (arg === "concat") {
  concat(param1);
}
