function generateRandom(digit: number): string {
  console.log("generating number...");

  let numberdigit = "1";
  let multiplier = "9";

  for (let index = 1; index < digit; index++) {
    numberdigit += "0";
    multiplier += "9";
  }

  console.log(numberdigit, multiplier);
  const generatedNumber = Math.floor(
    Number(numberdigit) + Math.random() * Number(multiplier)
  );

  return String(generatedNumber).substring(0, digit);
}

export default {
  generateRandom,
};
