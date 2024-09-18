// collection of data on facebook through automated means is

// "https://quotes.toscrape.com/"
// web scraping from scratch

// input URL from form
// check form submission is a URL

// check if they allow scrapping
// before scraping see if they offer an API

const isValidURL = (url) => {
    const urlPattern = /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/i
    return urlPattern.test(url)
}

// const test = () => {
//     console.log("test")
//     var para = document.createElement("a")
//     var text = document.createTextNode("this is an example")
//     para.appendChild(text)
//     para.setAttribute("href", "https://quotes.toscrape.com/")
//     document.getElementById("div1").appendChild(para)
// }

const test = () => {
    const htmlString = `
  <div>
    <h1>Hello, World!</h1>
    <p>This is a paragraph.</p>
  </div>
`

    const parser = new DOMParser()
    const document1 = parser.parseFromString(htmlString, "text/html")

    console.log(document1)
}

let test1 = document.getElementById("div1")
test1.addEventListener("click", test)

let form = document.getElementById("form1")

form.addEventListener("submit", (e) => {
    e.preventDefault()

    let url = document.getElementById("url")

    // console.log(url.value)
    if (isValidURL(url.value)) {
        console.log(url.value + " is valid!")

        // check robots.txt file
        fetch(url.value + "robots.txt")
            .then((response) => response.text())
            .then((data) => console.log(data))
    } else {
        console.log(url.value + " is NOT valid!")
    }
})
