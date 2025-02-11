document.addEventListener("DOMContentLoaded", () => {
    const buttons = document.querySelectorAll(".day-btn");
    const animatedBox = document.getElementById("animated-box");

    let currentDay = null;

    buttons.forEach(button => {
        button.addEventListener("click", () => {
            const day = button.getAttribute("data-day");
            const color = button.style.backgroundColor;

            if (currentDay === day) return;  

            
            animatedBox.style.transition = "top 0.5s ease-in-out";
            animatedBox.style.top = "-120%";

            
            setTimeout(() => {
                animatedBox.style.backgroundColor = color;
                animatedBox.style.transition = "top 0.8s ease-in-out, background-color 0.5s ease-in-out 0.5s";
                animatedBox.style.top = "0";
            }, 500);

            currentDay = day;  
        });
    });
});
