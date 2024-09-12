
class ConsoleHandler {

    constructor(main_console, console_input, console_body, anim_speed)
    {
        window.CONSOLE_main_console = main_console;
        window.CONSOLE_input = console_input;
        window.CONSOLE_console = console_body;
        window.CONSOLE_anim_speed = anim_speed*100;
        window.CONSOLE_interval;
        window.CONSOLE_current_frame = 0;

        let CONSOLE_WIDTH = 600;
        let CONSOLE_OFFSET = 300;
        if(window.innerWidth < CONSOLE_WIDTH)
        {
            main_console.style.transform="scale(" + (window.innerWidth/CONSOLE_WIDTH)  + ") translateX(-" + CONSOLE_OFFSET*(1-(window.innerWidth/600)) + "px) translateY(-" + CONSOLE_OFFSET*(1-(window.innerWidth/CONSOLE_WIDTH)) + "px)";
            main_console.style.margin = "auto";
        }
        window.addEventListener("resize", function(event){
            if(window.innerWidth < CONSOLE_WIDTH)
            {
                main_console.style.transform="scale(" + (window.innerWidth/CONSOLE_WIDTH)  + ") translateX(-" + CONSOLE_OFFSET*(1-(window.innerWidth/600)) + "px) translateY(-" + CONSOLE_OFFSET*(1-(window.innerWidth/CONSOLE_WIDTH)) + "px)";
                main_console.style.margin = "auto";
            }else{
                main_console.style.transform="scale(1)";
                main_console.style.margin = "auto";
                main_console.style.width = "80%";
            }
        },true)

        window.CONSOLE_PROGRAMS = {
            "load PROJECTS" : 
            ["  ____   ____    ___       _  _____  ____  _____  ____  ",
            " |  _ \\ |  _ \\  / _ \\     | || ____|/ ___||_   _|/ ___|", 
            " | |_) || |_) || | | | _  | ||  _| | |      | |  \\___ \\", 
            " |  __/ |  _ < | |_| || |_| || |___| |___   | |   ___) |",
            " |_|    |_| \\_\\ \\___/  \\___/ |_____|\\____|  |_|  |____/ ",
            "+------------------------------------------------------------+",
            "|                       CLICK A PROJECT                      |",
            "+------------------------------------------------------------+",
            "|",
            "|",
            "|",
            "+- <a style='color:var(--blue-cli); cursor:pointer;'>>QUANT<</a>",
            "|   |",
            "|   +- <a style='color:var(--blue-cli); cursor:pointer;'> Monte-Carlo Option Pricer</a>",
            "|   |",
            "|   +- <a style='color:var(--blue-cli); cursor:pointer;'> Implied Volatility Calculator</a>",
            "|   |",
            "|   +- <a style='color:var(--blue-cli); cursor:pointer;'> Strategy Backtester</a>",
            "|",
            "|",
            "+- <a style='color:var(--red-cli); cursor:pointer;'>>MACHINE LEARNING<</a>",
            "|   |",
            "|   +- <a style='color:var(--red-cli); cursor:pointer;'>Muon Momentum Regression (BDT)</a>",
            "|   |",
            "|   +- <a style='color:var(--red-cli); cursor:pointer;'>Background Suppression (NN)</a>",
            "|",
            "|",
            "+- <a style='color:var(--yellow-cli); cursor:pointer;'>>APP DEVELOPMENT<</a>",
            "    |",
            "    +- <a style='color:var(--yellow-cli); cursor:pointer;'>Data Quality Management</a>",
            "    |",
            "    +- <a style='color:var(--yellow-cli); cursor:pointer;'>UI/UX Database Interface</a>"],
            "load EXPERIENCE" : 
            ["LOADING EXPERIENCE VIEWER...",
            ".",".",".",
            "LAUNCHING..."],
            "load ABOUT_ME" : 
            []
        }

    }

    clear_console(){
        window.CONSOLE_console.innerHTML = "";
        clearInterval(window.CONSOLE_interval);
    }

    new_command(CMD){
        window.CONSOLE_input.value = CMD;
        this.load_command();
    }

    load_command(){

        this.clear_console();
        let CMD = window.CONSOLE_input.value;
        window.CONSOLE_console_text = window.CONSOLE_PROGRAMS[CMD];

        window.CONSOLE_current_frame = 0;
        window.CONSOLE_interval = setInterval(function(){
            if(window.CONSOLE_current_frame < 4)
            {
                window.CONSOLE_console.innerHTML += ".";
            }else if(window.CONSOLE_current_frame == 4)
            {
                window.CONSOLE_console.innerHTML = window.CONSOLE_console_text[window.CONSOLE_current_frame-4] + "<br>";
            }else if(window.CONSOLE_current_frame-4 < window.CONSOLE_console_text.length){
                window.CONSOLE_console.innerHTML += window.CONSOLE_console_text[window.CONSOLE_current_frame-4] + "<br>";
            }else{
                clearInterval(window.CONSOLE_interval);
                return;
            }
            
            window.CONSOLE_current_frame += 1;
        },window.CONSOLE_anim_speed);
    }
}
