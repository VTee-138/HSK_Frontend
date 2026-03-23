import { get, put } from "../common/apiClient";

const PATH_TEST = "/user";

const getUserInfoById = async () => {
  return await get(PATH_TEST + "/user-info");
};
const updatePassword = async (password) => {
  return await put(PATH_TEST + "/update-password", { password });
};
const updateInfoUser = async (body) => {
  return await put(PATH_TEST + "/update-info-user", body);
};

const getMyCourses = async (page = 1, limit = 6) => {
  return await get(PATH_TEST + `/my-courses?page=${page}&limit=${limit}`);
};

export { getUserInfoById, updatePassword, updateInfoUser, getMyCourses };
