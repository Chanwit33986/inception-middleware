import { decryptAES } from "decrypt-aes-js";
import { encryptAES } from "encrypt-aes-js";
import { NextRequest, NextResponse } from "next/server";

export const getInceptionCookieServer = (
  request: NextRequest,
  name: string
) => {
  let secretKey = process.env.SECRET_KEY || "";
  let projectName = process.env.PROJECT_NAME || "";
  let cookieName = `${name}${projectName}`;
  if (request.cookies.has(cookieName)) {
    let cookieVal = request.cookies.get(cookieName)?.value;
    if (cookieVal) {
      const decoder = new TextDecoder();
      let strBuffer = Buffer.from(cookieVal, "base64");
      let decoreStr = decoder.decode(strBuffer);
      let encryptData = JSON.parse(decoreStr);
      let decryptData = decryptAES(
        secretKey,
        encryptData?.data,
        encryptData?.iv
      );
      if (decryptData) {
        let jsonDecryptData = JSON.parse(decryptData);
        return jsonDecryptData?.InceptionD;
      }
    }
  }
  return undefined;
};

export const setCookieInception = (
  response: NextResponse,
  name: string,
  value: any
) => {
  let secretKey = process.env.SECRET_KEY || "";
  let projectName = process.env.PROJECT_NAME || "";
  const encoder = new TextEncoder();
  let encObj = {
    InceptionD: JSON.stringify(value),
  };
  let encryptData = encryptAES(secretKey, encObj);
  let cookieName = `${name}${projectName}`;
  let strBase64 = Buffer.from(
    encoder.encode(JSON.stringify(encryptData))
  ).toString("base64");
  response.cookies.set(cookieName, strBase64);
};

export const hasInceptionCookie = (request: NextRequest, name: string) => {
  let projectName = process.env.PROJECT_NAME || "";
  let cookieName = `${name}${projectName}`;
  return request.cookies.has(cookieName);
};

export const clearAllInpceptionCookie = (request: NextRequest) => {
  const allCookies = request.cookies.getAll();
  if (allCookies.length > 0) {
    allCookies.map((cookie) => {
      request.cookies.delete(cookie.name);
    });
  }
};
