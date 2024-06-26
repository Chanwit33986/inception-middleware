import { NextRequest, NextResponse } from "next/server";
import { decryptAES } from "decrypt-aes-js";
import {
  clearAllInpceptionCookie,
  getInceptionCookieServer,
  hasInceptionCookie,
  setCookieInception,
} from "./utils/inecptionCookies";
import {
  checkUserAppMenuPermission,
  generateRedirectUrl,
  getAvaliableFirstTimeToPage,
  getInceptionUser,
  increaseInceptionTimeout,
  printErrorMessage,
} from "./utils/inceptionShare";

export const InceptionMiddleware = async (request: NextRequest) => {
  let secretKey = process.env.SECRET_KEY || "";
  let appId = process.env.APP_ID || "";
  try {
    let erp = request.nextUrl.searchParams.get("erp");
    if (erp && !hasInceptionCookie(request, "tlt_main")) {
      //@ts-ignore
      let erpStr = erp?.replaceAll(" ", "+");
      let iv = erpStr?.split("||")[0]?.toString();
      let data = erpStr?.split("||")[1]?.toString();

      let decryptVal = decryptAES(secretKey, data, iv);
      let decryptJson = JSON.parse(decryptVal);
      if (decryptJson?.app_id === appId) {
        const refId = decryptJson?.ref_id?.toString();
        const firstTimeRes = await getAvaliableFirstTimeToPage(refId);
        if (firstTimeRes) {
          const response = NextResponse.redirect(
            new URL(decryptJson?.origin_target)
          );
          if (decryptJson?.param_for_menu !== null) {
            setCookieInception(
              response,
              "tlt_p_for_menu",
              decryptJson?.param_for_menu
            );
          }
          if (!hasInceptionCookie(request, "tlt_u_data")) {
            const userRes = await getInceptionUser(firstTimeRes?.data);
            if (userRes) {
              setCookieInception(response, "tlt_u_data", userRes?.data);
            }
          }
          setCookieInception(response, "tlt_main", firstTimeRes?.data);
          return response;
        } else {
          let redirectUrl = generateRedirectUrl(
            "RE_LOGIN",
            "กรุณา Login ใหม่อีกครั้ง",
            "URL ถูกใช้ไปแล้ว โดยจะไม่สามารถใช้ URL ซ้ำได้ ขอให้ GEN URL จากต้นทางใหม่อีกครั้ง"
          );
          clearAllInpceptionCookie(request);
          return NextResponse.redirect(redirectUrl);
        }
      }
    } else if (hasInceptionCookie(request, "tlt_main")) {
      let response;
      // let inceptionUser;
      let guid = getInceptionCookieServer(request, "tlt_main");

      // if (hasInceptionCookie(request, "tlt_u_data")) {
      //   inceptionUser = getInceptionCookieServer(request, "tlt_u_data");
      // } else {
      //   const userRes = await getInceptionUser(guid);
      //   if (userRes) {
      //     response = NextResponse.next();
      //     setCookieInception(response, "tlt_u_data", userRes?.data);
      //   } else {
      //     let redirectUrl = generateRedirectUrl(
      //       "RE_LOGIN",
      //       "คุณได้เข้าใช้งานเกินเวลาที่กำหนด ขอให้ทำการ Login ใหม่อีกครั้ง",
      //       "Session Time Out"
      //     );
      //     clearAllInpceptionCookie(request);
      //     return NextResponse.redirect(redirectUrl);
      //   }
      // }
      // if (inceptionUser) {
      //   let appMenuPermissionObj = {
      //     mode: "menu",
      //     app_id: appId,
      //     menu: request.nextUrl.pathname,
      //     user_id: inceptionUser?.user_id,
      //   };
      //   const appMenuPermissionRes = await checkUserAppMenuPermission(
      //     appMenuPermissionObj
      //   );
      //   if (appMenuPermissionRes && !appMenuPermissionRes.data) {
      //     let redirectUrl = generateRedirectUrl(
      //       "RE_LOGIN",
      //       "คุณไม่มีสิทธิ์เข้าถึงเมนูนี้",
      //       "ไม่สามารถ Get permission ได้หรืออาจจะไม่ได้ถูก Set สิทธิไว้ ตรวจสอบการ connect stored และสิทธิการใช้งาน"
      //     );
      //     clearAllInpceptionCookie(request);
      //     return NextResponse.redirect(redirectUrl);
      //   }
      // }

      if (guid) {
        const inCreaseRes = await increaseInceptionTimeout(guid);
        response = NextResponse.next();
        // if (inCreaseRes && inCreaseRes?.status === 1) {
        if (inCreaseRes) {
          setCookieInception(
            response,
            "tlt_timeout",
            inCreaseRes?.data?.expireDate
          );
          return response;
        } else {
          let redirectUrl = generateRedirectUrl(
            "RE_LOGIN",
            "คุณได้เข้าใช้งานเกินเวลาที่กำหนด ขอให้ทำการ Login ใหม่อีกครั้ง",
            "Session Time Out"
          );
          clearAllInpceptionCookie(request);
          return NextResponse.redirect(redirectUrl);
        }
      }
    } else {
      let redirectUrl = generateRedirectUrl(
        "RE_LOGIN",
        "คุณได้เข้าใช้งานเกินเวลาที่กำหนด ขอให้ทำการ Login ใหม่อีกครั้ง",
        "Session Time Out"
      );
      if (request.url.includes("/api")) {
        return NextResponse.json(
          {
            status: 401,
            message:
              "PLEASE_RE_LOGIN ! คุณได้เข้าใช้งานเกินเวลาที่กำหนด ขอให้ทำการ Login ใหม่อีกครั้ง",
          },
          { status: 401 }
        );
      }
      return NextResponse.redirect(redirectUrl);
    }
  } catch (error) {
    printErrorMessage(error);
    let redirectUrl = generateRedirectUrl(
      "RE_LOGIN",
      "ดูเหมือนจะมีบางอย่างผิดพลาด ขอให้ทำการแจ้งผู้ดูแลระบบ",
      JSON.stringify(error)
    );
    clearAllInpceptionCookie(request);
    return NextResponse.redirect(redirectUrl);
  }
};

export const GetInceptionUserServer = async (request: NextRequest) => {
  try {
    if (hasInceptionCookie(request, "tlt_u_data")) {
      return getInceptionCookieServer(request, "tlt_u_data");
    } else {
      let guid = getInceptionCookieServer(request, "tlt_main");
      if (guid) {
        const userRes = await getInceptionUser(guid);
        if (userRes) {
          return userRes?.data;
        }
      }
    }
    return undefined;
  } catch (error) {
    printErrorMessage(error);
  }
};
