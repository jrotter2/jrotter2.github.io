
class ExpHandler {

    constructor(main_div, main_holder)
    {
        this.main_div = main_div;
        this.main_holder = main_holder;
        let EXP_WIDTH = 500;
        let EXP_OFFSET = 250;
        this.EXP_WIDTH = EXP_WIDTH;
        if(window.innerWidth < EXP_WIDTH)
        {
            main_div.style.transform="scale(" + (window.innerWidth/EXP_WIDTH)  + ")";
        }
        window.addEventListener("resize", function(event){
            if(window.innerWidth < EXP_WIDTH)
            {
                main_div.style.transform="scale(" + (window.innerWidth/EXP_WIDTH)  + ")";
            }else{
                main_div.style.transform="scale(1)";
            }
        },true);
    }

    close()
    {
        this.main_div.style.transform="scaleY(0.0) translateY(-100%)";
        setTimeout(function(){
            my_exp.main_div.hidden = true;
        }, 490)
    }

    open()
    {
        my_exp.main_div.style.transform="scaleY(0)";
        my_exp.main_div.hidden = false;
        setTimeout(function(){
            if(window.innerWidth < my_exp.EXP_WIDTH)
            {
                my_exp.main_div.style.transform="scaleY(" + (window.innerWidth/my_exp.EXP_WIDTH)  + ")";
            }else{
                my_exp.main_div.style.transform="scaleY(1)";
            }
        },600);
    }
}

