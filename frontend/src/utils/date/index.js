export const formatPostDate = (createdAt) => {
  const options = { year: "numeric", month: "long", day: "numeric" };
  const createdDate = new Date(createdAt);
  const date = new Date();
  console.log(createdAt);
  const inSeconds = Math.floor((date - createdDate) / 1000);
  const inMinutes = Math.floor(inSeconds / 60);
  const inHours = Math.floor(inMinutes / 60);
  const inDays = Math.floor(inHours / 24);

  console.log("in seconds: ", inSeconds);

  if (inDays > 1) {
    return createdDate.toLocaleDateString("en-US", options);
  } else if (inDays === 1) {
    return "1d";
  } else if (inHours >= 1) {
    return `${inHours}h`;
  } else if (inMinutes >= 1) {
    return `${inMinutes}m`;
  } else {
    return "Just Now";
  }
};
