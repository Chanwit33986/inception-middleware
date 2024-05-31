import { encryptAES } from "encrypt-aes-js";
import request from "./request";

export const getInceptionUser = async (guid: string) => {
  try {
    let url = `${process.env.INCEPTION_API_URL}update/Getuser`;
    let body = {
      guid: guid,
    };
    const response = await request.post(url, body);
    if (response.status === 200) {
      return response.data;
    }
  } catch (error) {
    return null;
  }
};

export const generateRedirectUrl = (
  refId: string,
  directMessage: string,
  directMessageDev: string
) => {
  let secretKey = process.env.SECRET_KEY || "";
  let currentTarget = process.env.CURRENT_TARGET || "";
  let appId = process.env.APP_ID || "";
  let payload = {
    ref_id: refId,
    app_id: appId,
    menu_id: "",
    origin_target: currentTarget,
    direct_controller: "",
    direct_view: "",
    direct_message: directMessage,
    direct_message_dev: directMessageDev,
    param_for_menu: "",
  };
  let inceptionUrl = process.env.INCEPTION_URL || "";
  const encryptVal = encryptAES(secretKey, payload);
  let redirectUrl = `${inceptionUrl}/?erp=${encryptVal.iv}||${encryptVal.data}`;
  return redirectUrl;
};

export const getAvaliableFirstTimeToPage = async (guid: string) => {
  try {
    let url = `${process.env.INCEPTION_API_URL}update/GetAvaliableFirstTimeToPage`;
    let body = {
      guid: guid,
    };
    const response = await request.post(url, body);
    if (response.status === 200) {
      return response.data;
    }
  } catch (error) {
    return null;
  }
};

export const increaseInceptionTimeout = async (guid: string) => {
  try {
    let url = `${process.env.INCEPTION_API_URL}update/IncreaseTimeout`;
    let body = {
      guid: guid,
    };
    const response = await request.post(url, body);
    if (response.status === 200) {
      return response.data;
    }
  } catch (error) {
    return null;
  }
};

export const checkUserAppMenuPermission = async (payload: any) => {
  try {
    let url = `${process.env.INCEPTION_API_URL}check/userpermission`;
    const response = await request.post(url, payload);
    if (response.status === 200) {
      return response.data;
    }
  } catch (error) {
    return null;
  }
};

export const printErrorMessage = (message: any) => {
  console.log("--------------Inception MiddleWare Error--------------");
  console.log(message);
  console.log("------------------------------------------------------");
};
