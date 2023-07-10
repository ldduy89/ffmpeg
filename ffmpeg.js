const _ = require("lodash");
const fs = require("fs");
const fsExtra = require("fs-extra");
const { spawn } = require("child_process");
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

const concat = async () => {
  let files = fs.readdirSync(outputPath).filter((f) => !f.includes("_"));
  files = _.orderBy(files, (f) => Number(f.replace(/ \(.\)|\.mp4/g, "")));
  console.log(files);
  let firstFile = Number(files[0].replace(/ \(.\)|\.mp4/g, ""));
  for (let i = 0; i < files.length; i += numberConcat) {
    if (i + numberConcat <= files.length) {
      const arr = [];
      const arrRoot = [];
      const arrPromise = [];
      for (let j = i; j < i + numberConcat; j++) {
        arr.push(`data/${files[j]}.ts`);
        arrRoot.push(`${outputPath}/${files[j]}`);
        arrPromise.push(`ffmpeg -i ${outputPath}/${files[j]} -codec copy data/${files[j]}.ts`);
      }
      // console.log(arrPromise);
      await Promise.all(arrPromise.map((query) => promiseExec(query)));
      const fileOutput = `${fotmatNumber(i + firstFile)}_${fotmatNumber(i + firstFile + numberConcat - 1)}.mp4`;
      const str = `ffmpeg -i concat:${arr.join("|")} -codec copy ${outputPath}/${fileOutput}`;
      console.log(str);
      await promiseExec(str);
      await Promise.all(arr.map((item) => fsExtra.remove(item)));
      // await Promise.all(arrRoot.map((item) => fsExtra.remove(item)));
      console.log("done step");
    }
  }
};

const donwloadVideo = async (link, array, name = '') => {
  // console.log(link, array);
  const arr = array.split(',');
  console.log(arr);
  await Promise.all(arr.map(i => {
    const query = `ffmpeg -i ${link.replace(new RegExp(':i', "g"), i)} -c copy -bsf:a aac_adtstoasc ${outputPath}\\${name}${i}.mp4`;
    // console.log(query);
    return promiseExec(query)
    // return 1
  }))
  // for (let j = 0; j < arr.length; j++) {
  //   const i = arr[j]
  //   // const link = `https://s3.truyentot.com/media/video-clips/hhtq/O-Re/${i}/O-Re-${i}.m3u8`;
    
  //   // const link2 = `https://s2.truyentot.com/media/video-clips/hhtq/Nhat-niem-vinh-hang/${i}/Nhat-niem-vinh-hang-${i}.m3u8`;
  //   const query = `ffmpeg -i ${link} -c copy -bsf:a aac_adtstoasc ${outputPath}\\${i}.mp4`;
  //   await promiseExec(query);
  // }
};

const reName = async () => {
  const path = 'F:\\XDCYV'
  const files = fs.readdirSync(path).filter(f => f.includes('.mp4') && f.includes('.HD1080p'));
  console.log(files);
  files.forEach((file, i) => {
    const index = i+9;
    const name =  `${index + 1 < 10 ? '0' : ''}${index + 1}.mp4`
    console.log(name);
    // let newFile = file.replace("[国漫]伍六七之暗影宿命 - ", "");
    // newFile = newFile.replace(" 不死黑鸟[1080P AVC AAC MKV]", "");
    // newFile = newFile.replace("SNBMZCF.2022.EP", "");
    // newFile = newFile.replace(".HD1080P.X264.AAC.Mandarin.CHS.BDYS", "");
    // newFile = newFile.replace("[Hall_of_C] Yi_Nian_Yong_Heng_AWE_", "");
    // newFile = newFile.replace("[嘀哩嘀哩dilidm.org][国漫]妖神记第", "");
    // newFile = newFile.replace("[36dm.org]妖神记第", "");
    // newFile = newFile.replace("[森之屋acgsen.com]妖神记第", "");
    // console.log(newFile);
    fs.renameSync(path + "\\" + file, path + "\\" + name);
  });
};
// for (let i = 50; i < 88; i++) {
//   fs.writeFileSync('./subtitles/'+ i + '.txt', '')
// }
// donwloadVideo();
// concat();
// covertVideo();
// reName()

const arg = process.argv[2];
const param1 = process.argv[3];
const param2 = process.argv[4];
const param3 = process.argv[5];

if (arg === "donwload") {
  donwloadVideo(param1, param2, param3);
}
// https://s2.truyentot.com/media/video-clips/hhtq/Dau-Pha-Thuong-Khung-phan-5/:i/Dau-Pha-Thuong-Khung-phan-5-:i.m3u8