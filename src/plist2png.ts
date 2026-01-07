import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { basename, dirname, extname, join } from "path";
import { argv } from "process";
import sharp from "sharp";

interface IFrameData {
    frame: {
        x: number,
        y: number,
        w: number,
        h: number
    },
    rotated: boolean,
    trimmed: boolean,
    spriteSourceSize: {
        x: number,
        y: number,
        w: number,
        h: number
    },
    sourceSize: {
        w: number,
        h: number
    },
    pivot: {
        x: number,
        y: number
    }
}
interface IAtlasData {
    frames: { [key: string]: IFrameData },
    meta: {
        app: string,
        version: string,
        image: string,
        format: string,
        size: {
            w: number,
            h: number
        },
        scale: number
    }
}

function uint16ToTwoUint8(value: number) {
    const lowByte = value & 0xFF;      // 获取低8位
    const highByte = (value >> 8) & 0xFF; // 获取高8位

    return [lowByte, highByte];
    // int reconstructed = (bytes.g << 8) | bytes.r;
}

function writeFileSync_safe(dir: string, data: any) {
    const path = dirname(dir);
    if (path && !existsSync(path)) {
        mkdirSync(path, { recursive: true });
    }
    writeFileSync(dir, data);
}
function closestPowerOfTwoSide(area) {
    const side = Math.sqrt(area);
    const lowerPower = Math.floor(Math.log2(side));
    const upperPower = lowerPower + 1;

    const upperSide = Math.pow(2, upperPower)
    return upperSide;
}

const inputFile = argv[2];

const plistInfo = readFileSync(inputFile, 'utf-8');
const plistData = JSON.parse(plistInfo) as IAtlasData;

// 获取所有动画列表
const frames = plistData.frames;
const animList: { [key: string]: [number, IFrameData][] } = {};
for (const key in frames) {
    const names = key.split("_");
    const animName = names[0];
    const animIndex = +names[1];
    if (!animList[animName]) {
        animList[animName] = [];
    }
    animList[animName].push([animIndex, frames[key]]);
}
// 排序
for (const key in animList) {
    animList[key].sort((a, b) => a[0] - b[0]);
}

// 输出
const pngInfo: { [key: string]: [number, number] } = {};
const pngData: number[] = [];
let pIndex = 0;
for (const key in animList) {
    const animFrames = animList[key];
    let pStartIndex = pIndex;
    for (let g = 0, h = animFrames.length; g < h; g++) {
        const frame = animFrames[g];
        const frameData = frame[1];
        const ltX = frameData.frame.x, ltY = frameData.frame.y;
        const rbX = ltX + frameData.frame.w, rbY = ltY + frameData.frame.h;

        const sourceSize = frameData.sourceSize;
        const spriteSourceSize = frameData.spriteSourceSize;
        // const scx = sourceSize.w * 0.5, scy = sourceSize.h * 0.5;
        // const tcx = spriteSourceSize.x + spriteSourceSize.w * 0.5, tcy = spriteSourceSize.y + spriteSourceSize.h * 0.5;
        // const offsetX = tcx - scx, offsetY = tcy - scy;

        pngData.push(ltX, ltY, rbX, rbY, sourceSize.w, sourceSize.h, spriteSourceSize.x, spriteSourceSize.y);
        pIndex++;
    }
    pngInfo[key] = [pStartIndex, pIndex];
}
const length = pngData.length;
let size = closestPowerOfTwoSide(length / 2);
let imageDataArray = new Uint8ClampedArray(size * size * 4);
let index = 0;
for (let i = 0; i < length; i += 8) {
    const ltX = pngData[i], ltY = pngData[i + 1];
    const rbX = pngData[i + 2], rbY = pngData[i + 3];
    const sw = pngData[i + 4], sh = pngData[i + 5];
    const tx = pngData[i + 6], ty = pngData[i + 7];
    const rg = uint16ToTwoUint8(ltX), ba = uint16ToTwoUint8(ltY),
        rg2 = uint16ToTwoUint8(rbX), ba2 = uint16ToTwoUint8(rbY),
        rg3 = uint16ToTwoUint8(sw), ba3 = uint16ToTwoUint8(sh),
        rg4 = uint16ToTwoUint8(tx), ba4 = uint16ToTwoUint8(ty);

    imageDataArray[index++] = rg[0];
    imageDataArray[index++] = rg[1];
    imageDataArray[index++] = ba[0];
    imageDataArray[index++] = ba[1];

    imageDataArray[index++] = rg2[0];
    imageDataArray[index++] = rg2[1];
    imageDataArray[index++] = ba2[0];
    imageDataArray[index++] = ba2[1];

    imageDataArray[index++] = rg3[0];
    imageDataArray[index++] = rg3[1];
    imageDataArray[index++] = ba3[0];
    imageDataArray[index++] = ba3[1];

    imageDataArray[index++] = rg4[0];
    imageDataArray[index++] = rg4[1];
    imageDataArray[index++] = ba4[0];
    imageDataArray[index++] = ba4[1];
}
const inputDir = dirname(inputFile);
const inputName = basename(inputFile, extname(inputFile));
const pngPath = join(inputDir, `${inputName}_info.png`);
sharp(imageDataArray, {
    raw: {
        width: size, height: size, channels: 4
    }
})
.png().toFile(pngPath);
const pngInfoPath = join(inputDir, `${inputName}_info.json`);
writeFileSync_safe(pngInfoPath, JSON.stringify(pngInfo));