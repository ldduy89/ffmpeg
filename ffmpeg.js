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
  console.log(files);
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
  // console.log(link, array);
  const arr = array.split(",");
  console.log(arr);
  await Promise.all(
    arr.map((i) => {
      const query = `ffmpeg -i ${link.replace(new RegExp(":i", "g"), i)} -c copy -bsf:a aac_adtstoasc ${outputPath}\\${name}${i}.mp4`;
      // console.log(query);
      return promiseExec(query);
      // return 1
    })
  );
  // for (let j = 0; j < arr.length; j++) {
  //   const i = arr[j]
  //   // const link = `https://s3.truyentot.com/media/video-clips/hhtq/O-Re/${i}/O-Re-${i}.m3u8`;

  //   // const link2 = `https://s2.truyentot.com/media/video-clips/hhtq/Nhat-niem-vinh-hang/${i}/Nhat-niem-vinh-hang-${i}.m3u8`;
  //   const query = `ffmpeg -i ${link} -c copy -bsf:a aac_adtstoasc ${outputPath}\\${i}.mp4`;
  //   await promiseExec(query);
  // }
};

const reName = async () => {
  const path = "F:\\XDCYV";
  const files = fs.readdirSync(path).filter((f) => f.includes(".mp4") && f.includes(".HD1080p"));
  console.log(files);
  files.forEach((file, i) => {
    const index = i + 9;
    const name = `${index + 1 < 10 ? "0" : ""}${index + 1}.mp4`;
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

const downVod = async (item, index) => {
  console.log(item,index );
  // const arr = [];
  // let file = fs.readFileSync("file.txt", "utf-8");

  // do {
  //   const lastIndexN = file.lastIndexOf("\n", 500);
  //   const lastIndexDoc = file.lastIndexOf(".", 500);
  //   const lastIndex = file.length > 500 ? (lastIndexDoc ? lastIndexN : lastIndexDoc) : file.length;
  //   const text = file.substring(0, lastIndex + 1);
  //   arr.push(text);
  //   file = file.substring(lastIndex, file.length);
  // } while (file.length > 0);

  // const arrQuery = [];
  // for (let index = 93; index < arr.length; index++) {
  // const item = arr[index];
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
  // const URL = await fetch("https://zalo.ai/api/demo/v1/tts/synthesize", {
  //   method: "POST",
  //   headers: {
  //     "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
  //     cookie:
  //       "zai_did=8k9uAj3FNiTevcSSryzXoYYo643Dps3B9BeQIpGr; __zi=2000.SSZzejyD0jydXQcYsa00d3xBfxgO71AM8Ddbg8uE7SWetQ7jZGyJn2hRfgIF2Xk1Ajgdg8S85u0v.1; _zlang=vn; _gid=GA1.2.845259259.1689179594; _gat_gtag_UA_158812682_2=1; _ga_TMJX5TWN5E=GS1.1.1689179594.1.1.1689179676.60.0.0; _ga=GA1.1.1058072621.1689179594zai_did=8k9uAj3FNiTevcSSryzXoYYo643Dps_2ARGKGJWr; _zlang=vn; __zi=2000.SSZzejyD0jydXQcYsa00d3xBfxgO71AM8Ddbg8uE7SWetQ7dZ08KmolIgAEE0nM78zEeh8CD6u8t.1; _gid=GA1.2.195100481.1689180873; _gat_gtag_UA_158812682_2=1; _ga_TMJX5TWN5E=GS1.1.1689180873.1.1.1689180973.60.0.0; _ga=GA1.1.1497579659.1689180873",
  //     origin: "https://zalo.ai",
  //     referer: "https://zalo.ai/products/text-to-audio-converter"
  //   },
  //   body: formBody
  // })
  //   .then((response) => {
  //     return response.json();
  //   })
  //   .then((value) => {
  //     console.log(value);
  //     return value?.data?.url;
  //   });
  // console.log(URL);
  // // arrQuery.push();
  // // }
  // await new Promise((resolve, reject) => {
  //   setTimeout(() => {
  //     resolve();
  //   }, 3000);
  // });
  // await promiseExec(`ffmpeg -i ${URL} -c copy -bsf:a aac_adtstoasc download/item_${index < 10 ? `0${index}` : index}.mp4`);
  // await Promise.all(arrQuery.map((query) => promiseExec(query)))
};

const createVod = async () => {
  const arrText = fsExtra.readFileSync("./01.srt", "utf8").split("\n");
  // console.log(arrText);
  const arr = [];
  arrText.forEach((t, index) => {
    if (t.includes("-->")) {
      const str = [arrText[index + 1], arrText[index + 2]].join("\n").trim();
      arr.push(str);
    }
  });
  const arrChunk = _.chunk(_.drop(arr, 93), 10);
  // console.log(arrChunk[0]);
  // console.log(arr[92]);
  // console.log(_.chunk(_.take(arr, 94), 5));;
  for (let i = 0; i < arrChunk.length; i++) {
    const items = arrChunk[i];
    // console.log(items);
    await Promise.all(items.map((item, index) => downVod(item, i*5 + index))) ;
  }
  // console.log(arr);
  // downVod(arr);
};
createVod();
// readTxt();
// concat('./download');
// for (let index = 0; index < arr.length; index++) {
//   const element = arr[index];
//   var details = {
//     input: element,
//     speaker_id: 1,
//     speed: 1,
//     dict_id: 0,
//     quality: 1
//   };

//   var formBody = [];
//   for (var property in details) {
//     var encodedKey = encodeURIComponent(property);
//     var encodedValue = encodeURIComponent(details[property]);
//     formBody.push(encodedKey + "=" + encodedValue);
//   }
//   formBody = formBody.join("&");
//   const URL = await fetch("https://zalo.ai/api/demo/v1/tts/synthesize", {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
//       cookie:
//         "zai_did=8k9uAj3FNiTevcSSryzXoYYo643Dps308RGUGJCs; __zi=3000.SSZzejyD0jydXQcYsa00d3xBfxgP71AM8Tdbg8yFK8ncbEIdnq1PZckJwExEGbl3QfpgxSj8MC4s.1; _zlang=vn; _gid=GA1.2.818358167.1689172070; _gat_gtag_UA_158812682_2=1; _ga_TMJX5TWN5E=GS1.1.1689172070.1.1.1689172074.56.0.0; _ga=GA1.1.66179952.1689172070",
//       origin: "https://zalo.ai",
//       referer: "https://zalo.ai/products/text-to-audio-converter"
//     },
//     body: formBody
//   })
//     .then((response) => {
//       return response.json();
//     })
//     .then((value) => value.data.url);
//   const query = `ffmpeg -i ${URL} -c copy -bsf:a aac_adtstoasc test.mp4`;
//   console.log(query);
//   // promiseExec(query);
// }

// await promiseExec(value);
// };
// readTxt();
// const arr = [
//   "https://audiostream.lab.zalo.ai/m3u8/0308c9c1bfac56f20fbd.m3u8",
//   "https://audiostream.lab.zalo.ai/m3u8/a8407c890ae4e3babaf5.m3u8",
//   "https://audiostream.lab.zalo.ai/m3u8/dccd030475699c37c578.m3u8",
//   "https://audiostream.lab.zalo.ai/m3u8/d10608cf7ea297fcceb3.m3u8",
//   "https://audiostream.lab.zalo.ai/m3u8/ec820e4b78269178c837.m3u8",
//   "https://audiostream.lab.zalo.ai/m3u8/24faca33bc5e55000c4f.m3u8",
//   "https://audiostream.lab.zalo.ai/m3u8/8842638b15e6fcb8a5f7.m3u8",
//   "https://audiostream.lab.zalo.ai/m3u8/7a9b8852fe3f17614e2e.m3u8",
//   "https://audiostream.lab.zalo.ai/m3u8/03b1fd788b15624b3b04.m3u8",
//   "https://audiostream.lab.zalo.ai/m3u8/ca59319047fdaea3f7ec.m3u8",
//   "https://audiostream.lab.zalo.ai/m3u8/f06377aa01c7e899b1d6.m3u8",
//   "https://audiostream.lab.zalo.ai/m3u8/c74a478331eed8b081ff.m3u8",
//   "https://audiostream.lab.zalo.ai/m3u8/f33579fc0f91e6cfbf80.m3u8",
//   "https://audiostream.lab.zalo.ai/m3u8/30bea377d51a3c44650b.m3u8",
//   "https://audiostream.lab.zalo.ai/m3u8/2264bfadc9c0209e79d1.m3u8",
//   "https://audiostream.lab.zalo.ai/m3u8/8e2029e95f84b6daef95.m3u8",
//   "https://audiostream.lab.zalo.ai/m3u8/c2106cd91ab4f3eaaaa5.m3u8",
//   "https://audiostream.lab.zalo.ai/m3u8/cf8d64441229fb77a238.m3u8"
// ];

// Promise.all(arr.map((item, index) => promiseExec(`ffmpeg -i ${item} -c copy -bsf:a aac_adtstoasc tap1_${index < 10 ? `0${index}` : index}.mp4`)));
// promiseExec('ffmpeg -i https://audiostream.lab.zalo.ai/m3u8/ef628252f73f1e61472e.m3u8 -c copy -bsf:a aac_adtstoasc pikachu.mp4');
