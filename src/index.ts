import { NextRequest, NextResponse } from "next/server";
import { encryptAES } from "encrypt-aes-js";
import { decryptAES } from "decrypt-aes-js";
import axios from "axios";

export const InceptionMiddleware = async (request: NextRequest) => {
  let secretKey = process.env.SECRET_KEY || "";
  let erp = request.nextUrl.searchParams.get("erp");
  if (erp && !hasInceptionCookie(request, "tlt_main")) {
    //@ts-ignore
    let erpStr = erp?.replaceAll(" ", "+");
    let iv = erpStr?.split("||")[0]?.toString();
    let data = erpStr?.split("||")[1]?.toString();

    let decryptVal = decryptAES(secretKey, data, iv);
    let decryptJson = JSON.parse(decryptVal);
    const genTokenRes = await generateToken();
    if (genTokenRes) {
      const accessToken = genTokenRes.data.token;
      const refId = decryptJson?.ref_id?.toString();
      const firstTimeRes = await getAvaliableFirstTimeToPage(
        refId,
        accessToken
      );
      if (firstTimeRes) {
        const response = NextResponse.redirect(
          new URL(decryptJson?.origin_target)
        );
        if (!hasInceptionCookie(request, "tlt_u_data")) {
          const userRes = await getInceptionUser(
            firstTimeRes?.data,
            accessToken
          );
          if (userRes) {
            // response.cookies.set("tlt_u_data", JSON.stringify(userRes?.data));
            setCookieInception(response, "tlt_u_data", userRes?.data);
          }
        }
        // response.cookies.set("tlt_main", firstTimeRes?.data);
        setCookieInception(response, "tlt_main", firstTimeRes?.data);
        return response;
      }
    }
  } else if (hasInceptionCookie(request, "tlt_main")) {
    return NextResponse.next();
  } else {
    let currentTarget = process.env.CURRENT_TARGET || "";
    let appId = process.env.APP_ID || "";
    let payload = {
      ref_id: "RE_LOGIN",
      app_id: appId,
      menu_id: "",
      origin_target: currentTarget,
      direct_controller: "",
      direct_view: "",
      direct_message: "",
      direct_message_dev: "",
      param_for_menu: "",
    };
    let inceptionUrl = process.env.INCEPTION_URL || "";
    const encryptVal = encryptAES(secretKey, payload);
    let redirectUrl = `${inceptionUrl}/?erp=${encryptVal.iv}||${encryptVal.data}`;
    if (request.url.includes("/api")) {
      return NextResponse.json(
        {
          status: 401,
          message: "PLEASE_RE_LOGIN",
        },
        { status: 401 }
      );
    }
    return NextResponse.redirect(redirectUrl);
  }
};

export const GetInceptionUserServer = (request: NextRequest) => {
  return getInceptionCookieServer(request, "tlt_u_data");
};

const generateToken = async () => {
  try {
    let url = `${process.env.TLT_AUTHEN_URL}authentication/token/generate`;
    let body = {
      clientKey: process.env.TOKEN_CLIENT_KEY,
      secretKey: process.env.TOKEN_SECRET_KEY,
    };
    const response = await axios.post(url, body, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (response.status === 200) {
      return response.data;
    }
  } catch (error) {
    return null;
  }
};

const getAvaliableFirstTimeToPage = async (guid: string, token: string) => {
  try {
    let url = `${process.env.INCEPTION_API_URL}update/GetAvaliableFirstTimeToPage`;
    let body = {
      guid: guid,
    };
    const response = await axios.post(url, body, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    if (response.status === 200) {
      return response.data;
    }
  } catch (error) {
    return null;
  }
};

const getInceptionUser = async (guid: string, token: string) => {
  try {
    let url = `${process.env.INCEPTION_API_URL}update/Getuser`;
    let body = {
      guid: guid,
    };
    const response = await axios.post(url, body, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    if (response.status === 200) {
      return response.data;
    }
  } catch (error) {
    return null;
  }
};

const getInceptionCookieServer = (request: NextRequest, name: string) => {
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

const setCookieInception = (
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

const hasInceptionCookie = (request: NextRequest, name: string) => {
  let projectName = process.env.PROJECT_NAME || "";
  let cookieName = `${name}${projectName}`;
  return request.cookies.has(cookieName);
};
