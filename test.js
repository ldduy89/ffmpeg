const _ = require('lodash');
let fetch = require('node-fetch');
const FormData = require('form-data');
const fs = require("fs");
const fsExtra = require("fs-extra");
const { spawn } = require("child_process");
const inputPath = "C:\\Users\\Duy\\Desktop\\folder2";
const outputPath = "C:\\Users\\Duy\\Desktop\\folder";
const numberConcat = 10;
const from = "00:02:00";
const to = "00:07:00";

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

const readTxt = () => {
  const arr = [];
  let file = fs.readFileSync('file.txt', 'utf-8');

  do {
    const lastIndexN = file.lastIndexOf('\n', 500);
    const lastIndexDoc = file.lastIndexOf('.', 500);
    const lastIndex = file.length > 500 ? (lastIndexDoc ? lastIndexN : lastIndexDoc) : file.length;
    const text = file.substring(0, lastIndex + 1);
    arr.push(text);
    file = file.substring(lastIndex, file.length);
  } while (file.length > 0);
  // request.post('https://zalo.ai/api/demo/v1/tts/synthesize', function (error, response, body) {
  //     if (!error && response.statusCode === 200) {
  //         console.log(body) // Print the google web page.
  //     }
  // })
  let formData = new FormData();
  formData.append('input', arr[0]);
  formData.append('speaker_id', 1);
  formData.append('speed', 1.1);
  formData.append('dict_id', 0);
  formData.append('quality', 1);
  var details = {
    input: arr[0],
    speaker_id: 1,
    speed: 1.1,
    dict_id: 0,
    quality: 1,
  };

  var formBody = [];
  for (var property in details) {
    var encodedKey = encodeURIComponent(property);
    var encodedValue = encodeURIComponent(details[property]);
    formBody.push(encodedKey + '=' + encodedValue);
  }
  formBody = formBody.join('&');
  fetch('https://zalo.ai/api/demo/v1/tts/synthesize', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
      cookie:
        'zai_did=8k9uAj3FNiTevcSSryzXoYYo643DpsF5AR4OJpap; _zlang=vn; _gid=GA1.2.511974503.1689147830; zpsid=eMKnVbo-PZFDF2a7GRSWKT0rAmf6kpjOrIymSpMiRINDVs8NFgmnGwf_GsLby1jVj1nnIaBAF6En9L1KLF4FRfqfGqKCgqzrxMiyKIc2C07xKJypJm; zai_sid=ol69HwTBSNVN-8jAe4TgVjBYa3FJK3m3ohB2LzXGO6MjikCbWmnAURFHqGgaDcr5jkZm5B8DNaYQvEC5wbSUK-gcd17FVc4d_9oVS_0qAXVQu9PxP0; __zi=3000.SSZzejyD0jydXQcYsa00d3xBfxgP71AM8Tdbg8yFLe5cbEAgnq1VWskJxkFEGb_9QvtYuyj2LCOt.1; _ga=GA1.2.529417967.1689147830; _ga_TMJX5TWN5E=GS1.1.1689147829.1.1.1689148346.50.0.0',
      origin: 'https://zalo.ai',
      referer: 'https://zalo.ai/products/text-to-audio-converter',
    },
    body: formBody,
  })
    .then((response) => {
      return response.json();
    })
    .then((value) => {
      const query = `ffmpeg -i "${value.data.url}" -c copy -bsf:a aac_adtstoasc pikachu.mp4`;
      console.log(query);
      promiseExec(query).then();
    })
    .catch((err) => {
      console.log(err);
    });
};
readTxt();
