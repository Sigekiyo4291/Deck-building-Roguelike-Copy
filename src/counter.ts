export function setupCounter(element: any) {
  let counter = 0
  const setCounter = (count: any) => {
    counter = count
    element.innerHTML = `count is ${counter}`
  }
  element.addEventListener('click', () => setCounter(counter + 1))
  setCounter(0)
}
