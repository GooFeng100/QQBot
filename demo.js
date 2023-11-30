const currentDate = new Date();
const year = currentDate.getFullYear();
const month = String(currentDate.getMonth() + 1).padStart(2, '0'); // Month is zero-based
const day = String(currentDate.getDate()).padStart(2, '0');
const hour=String(currentDate.getHours()).padStart(2, '0');
const formattedDate = `${year}/${month}/${day} ${hour}:00`;
console.log(formattedDate);
console.log(new Date().toJSON());