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
const to = "00:07:00";

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
    const ffmpeg = spawn("ffmpeg", query.replace("ffmpeg ", "").split(" "));
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
        "zai_did=8k9uAj3FNiTevcSSryzXoYYo643Dps3B9BeQIpGr; __zi=2000.SSZzejyD0jydXQcYsa00d3xBfxgO71AM8Ddbg8uE7SWetQ7jZGyJn2hRfgIF2Xk1Ajgdg8S85u0v.1; _zlang=vn; _gid=GA1.2.845259259.1689179594; _gat_gtag_UA_158812682_2=1; _ga_TMJX5TWN5E=GS1.1.1689179594.1.1.1689179676.60.0.0; _ga=GA1.1.1058072621.1689179594zai_did=8k9uAj3FNiTevcSSryzXoYYo643Dps_2ARGKGJWr; _zlang=vn; __zi=2000.SSZzejyD0jydXQcYsa00d3xBfxgO71AM8Ddbg8uE7SWetQ7dZ08KmolIgAEE0nM78zEeh8CD6u8t.1; _gid=GA1.2.195100481.1689180873; _gat_gtag_UA_158812682_2=1; _ga_TMJX5TWN5E=GS1.1.1689180873.1.1.1689180973.60.0.0; _ga=GA1.1.1497579659.1689180873",
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
  await promiseExec(`ffmpeg -i ${URL} -c copy -bsf:a aac_adtstoasc ${path}/${index < 10 ? `0${index}` : index}.mp4`);
};

const createVodFromSub = async (pathFileSub) => {
  const arrText = fsExtra.readFileSync(pathFileSub, "utf8").split("\n");
  const name = _.replace(_.last(_.split(pathFileSub, '/')), '.srt', '');
  try {
    fsExtra.mkdirSync('./download/' + name)
  } catch (error) { }
  const arr = [];
  arrText.forEach((t, index) => {
    if (t.includes("-->")) {
      const str = [arrText[index + 1], arrText[index + 2]].join("\n").trim();
      arr.push(str);
    }
  });
  for (let i = 98; i < 110; i++) {
    await downVod(arr[i], i, './download/' + name);
  }
};
// createVod("./abc01.srt");

const createVodFromText = async (pathFileSub) => {
  const name = _.replace(_.last(_.split(pathFileSub, '/')), '.txt', '');
  const arr = [];
  try {
    fsExtra.mkdirSync('./download/' + name)
  } catch (error) { }
  do {
    const lastIndexN = file.lastIndexOf('\n', 500);
    const lastIndexDoc = file.lastIndexOf('.', 500);
    const lastIndex = file.length > 500 ? (lastIndexDoc ? lastIndexN : lastIndexDoc) : file.length;
    const text = file.substring(0, lastIndex + 1);
    arr.push(text);
    file = file.substring(lastIndex, file.length);
  } while (file.length > 0);
  for (let i = 0; i < arr.length; i++) {
    await downVod(arr[i], i, './download/' + name);
  }
  // await concat('./download/' + name)
};
createVodFromText('./daupha696.txt');
