import { get, post, del } from "../common/apiClient";

const PATH_TEST = "/exam-result";
const postTest = async (id, body) => {
  return await post(PATH_TEST + `/submit-test/${id}`, body);
};
const getResultById = async (examId, resultId) => {
  // Route: GET /exam-result/:examId?resultId=:resultId
  return await get(PATH_TEST + `/${examId}${resultId ? `?resultId=${resultId}` : ""}`);
};
const getResultAll = async (id) => {
  return await get(PATH_TEST + `?examId=${id}`);
};

const checkCorrectAnswers = async (id) => {
  return await get(PATH_TEST + `/check-correct-answers/${id}`);
};

const getExamHistory = async (id) => {
  return await get(PATH_TEST + `/history/${id}`);
};

const getUserAllExamHistory = async () => {
  return await get(PATH_TEST + `/history/all`);
}

const saveExamProgress = async (id, body) => {
  return await post(PATH_TEST + `/save-progress/${id}`, body);
};

const getUserStats = async () => {
  return await get(PATH_TEST + `/stats`);
};

const getPausedExam = async (id) => {
  return await get(PATH_TEST + `/check-paused/${id}`);
};

const deletePausedProgress = async (id) => {
  return await del(PATH_TEST + `/delete-paused/${id}`);
};

export { postTest, getResultById, getResultAll, checkCorrectAnswers, getExamHistory, getUserAllExamHistory, saveExamProgress, getPausedExam, deletePausedProgress, getUserStats };