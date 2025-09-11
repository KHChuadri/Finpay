import Challenge from "../../model/Challenge";
import HTTPError from "http-errors";

/**
 * <creating new user challenges by admin>
 * 
 * @param {string} category 
 * @param {string} title 
 * @param {string} description 
 * @param {string} startDate 
 * @param {string} endDate 
 * @param {number} exp 
 * @param {number} amountToGoal 
 * @returns {success: boolean, newChallenge : Challenge Object} object status and the challenge object
 */
export const adminCreateChallenge = async (
  category: string,
  title: string,
  description: string,
  startDate: string,
  endDate: string,
  exp: number,
  amountToGoal: number
) => {
  const requiredFields = {
    category,
    title,
    description,
    startDate,
    endDate,
    exp,
    amountToGoal,
  };
  const isMissing = (v: unknown) =>
    v === null ||
    v === undefined ||
    (typeof v === "string" && v.trim().length === 0) ||
    (typeof v === "number" && Number.isNaN(v));

  const missingFields = Object.entries(requiredFields)
    .filter(([, value]) => isMissing(value))
    .map(([key]) => key);

  if (missingFields.length > 0) {
    throw HTTPError(
      400,
      `adminCreateChallenge: required field(s) [${missingFields.join(
        ", "
      )}] are missing`
    );
  }

  const validCategories = ["pay", "recieve", "save"];
  if (!validCategories.includes(category)) {
    throw HTTPError(400, `adminCreateChallenge: Invalid category: ${category}`);
  }

  if (endDate <= startDate) {
    throw HTTPError(
      400,
      `adminCreateChallenge: end date must be later than start date. (${endDate} <= ${startDate})`
    );
  }

  const newChallenge = await Challenge.create({
    category: category,
    title: title,
    description: description,
    startDate: startDate,
    endDate: endDate,
    exp: exp,
    amountToGoal: amountToGoal,
  });

  return {
    success: true,
    newChallenge,
  };
};
