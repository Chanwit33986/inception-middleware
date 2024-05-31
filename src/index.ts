import { NextRequest, NextResponse } from "next/server";
import { decryptAES } from "decrypt-aes-js";
import {
  clearAllInpceptionCookie,
  getInceptionCookieServer,
  hasInceptionCookie,
  setCookieInception,
} from "./utils/inecptionCookies";
import {
  generateRedirectUrl,
  getAvaliableFirstTimeToPage,
  getInceptionUser,
  increaseInceptionTimeout,
  printErrorMessage,
} from "./utils/inceptionShare";

export const InceptionMiddleware = async (request: NextRequest) => {
  let secretKey = process.env.SECRET_KEY || "";
  try {
    let erp = request.nextUrl.searchParams.get("erp");
    if (erp && !hasInceptionCookie(request, "tlt_main")) {
      //@ts-ignore
      let erpStr = erp?.replaceAll(" ", "+");
      let iv = erpStr?.split("||")[0]?.toString();
      let data = erpStr?.split("||")[1]?.toString();

      let decryptVal = decryptAES(secretKey, data, iv);
      let decryptJson = JSON.parse(decryptVal);
      const refId = decryptJson?.ref_id?.toString();
      const firstTimeRes = await getAvaliableFirstTimeToPage(refId);
      if (firstTimeRes) {
        const response = NextResponse.redirect(
          new URL(decryptJson?.origin_target)
        );
        if (!hasInceptionCookie(request, "tlt_u_data")) {
          const userRes = await getInceptionUser(firstTimeRes?.data);
          if (userRes) {
            setCookieInception(response, "tlt_u_data", userRes?.data);
          }
        }
        setCookieInception(response, "tlt_main", firstTimeRes?.data);
        return response;
      } else {
        let redirectUrl = generateRedirectUrl();
        clearAllInpceptionCookie(request);
        return NextResponse.redirect(redirectUrl);
      }
    } else if (hasInceptionCookie(request, "tlt_main")) {
      let guid = getInceptionCookieServer(request, "tlt_main");
      if (guid) {
        const inCreaseRes = await increaseInceptionTimeout(guid);
        // if (inCreaseRes && inCreaseRes?.status === 1) {
        if (inCreaseRes) {
          const response = NextResponse.next();
          setCookieInception(
            response,
            "tlt_timeout",
            inCreaseRes?.data?.expireDate
          );
          return response;
        } else {
          let redirectUrl = generateRedirectUrl();
          clearAllInpceptionCookie(request);
          return NextResponse.redirect(redirectUrl);
        }
      }
    } else {
      let redirectUrl = generateRedirectUrl();
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
  } catch (error) {
    printErrorMessage(error);
    let redirectUrl = generateRedirectUrl();
    clearAllInpceptionCookie(request);
    return NextResponse.redirect(redirectUrl);
  }
};

export const GetInceptionUserServer = async (request: NextRequest) => {
  try {
    if (hasInceptionCookie(request, "tlt_u_data")) {
      return getInceptionCookieServer(request, "tlt_u_data");
    }
  } catch (error) {
    printErrorMessage(error);
  }
};
