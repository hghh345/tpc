/* -------------------------- */
/* FAST CAMERA ROLL */
/* -------------------------- */

const fastImages = [

"image1.jpeg",
"image2.jpeg",
"image3.jpeg",
"image4.jpeg",
"image5.jpeg",
"image6.jpeg",
"image7.jpeg",
"image8.jpeg"

].sort(() => Math.random() - .5);

let fastIndex = 0;

const fast = document.querySelector("#fast-slideshow");

setInterval(() => {

    fastIndex++;

    if (fastIndex >= fastImages.length) {

        fastIndex = 0;

    }

    fast.src = fastImages[fastIndex];

}, 250);


/* -------------------------- */
/* REMEMBER THEM */
/* -------------------------- */

const slowImages = [

"image9.jpeg",
"image10.jpeg",
"image11.jpeg",
"image12.jpeg",
"image13.jpeg",
"image14.jpeg"

].sort(() => Math.random() - .5);

let slowIndex = 0;

const slow = document.querySelector("#slow-slideshow");

setInterval(() => {

    slowIndex++;

    if (slowIndex >= slowImages.length) {

        slowIndex = 0;

    }

    slow.src = slowImages[slowIndex];

}, 1800);


/* -------------------------- */
/* CAMERA ROLL AUDIT */
/* -------------------------- */

const audits = [

[
"18,492",
"381 screenshots",
"42 sunsets",
"19 blurry nights",
"12 concerts",
"1 picture you'll wish you printed"
],

[
"24,116",
"742 screenshots",
"53 dogs",
"29 airport windows",
"14 birthdays",
"1 photo your future self needs"
],

[
"11,903",
"417 memes",
"87 selfies",
"33 dinners",
"18 late nights",
"1 tiny masterpiece"
],

[
"31,202",
"906 screenshots",
"51 blurry selfies",
"8 exes",
"64 parties",
"1 photo you'll never delete"
]

];

const randomAudit =
audits[Math.floor(Math.random()*audits.length)];

document.querySelector("#audit").textContent =

`camera roll audit

${randomAudit[0]} photos

☑ ${randomAudit[1]}
☑ ${randomAudit[2]}
☑ ${randomAudit[3]}
☑ ${randomAudit[4]}
☑ ${randomAudit[5]}`;


/* -------------------------- */
/* FADE IN ON SCROLL */
/* -------------------------- */

const sections =
document.querySelectorAll(".section");

const observer =
new IntersectionObserver(entries => {

entries.forEach(entry => {

if(entry.isIntersecting){

entry.target.classList.add("visible");

}

});

},
{
threshold:.15
});

sections.forEach(section=>{

observer.observe(section);

});
/* -------------------------- */
/* PRODUCT SLIDESHOW */
/* -------------------------- */

const productImages = [
    "i1.JPG",
    "i2.JPG",
    "i3.JPG",
    "i4.JPG"
];

let productIndex = 0;

const productSlide = document.querySelector("#product-slideshow");

console.log("product slideshow:", productSlide);
console.log("images:", productImages);

setInterval(() => {

    productIndex++;

    if (productIndex >= productImages.length) {
        productIndex = 0;
    }

    console.log("changing to:", productImages[productIndex]);

    productSlide.src = productImages[productIndex];

}, 1800);

