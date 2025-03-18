

export default async function readstdin() {
  return new Promise((resolve) => {
    process.stdin.on("data", d=> {
        resolve(d);
    })
  })
}