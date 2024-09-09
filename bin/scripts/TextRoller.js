
class TextRoller {

    constructor(anim_speed, rolls_per_letter)
    {
        window.ROLLER_rollers = [];
        window.ROLLER_duration = 0;
        window.ROLLER_current_frame = 0;
        window.ROLLER_anim_speed = anim_speed*100;
        window.ROLLER_interval;
        window.ROLLER_rolls_per_letter = rolls_per_letter;
    }

    reload()
    { 
        window.ROLLER_duration = 0;
        let elements = document.getElementsByClassName("text-roller");

        let current_elements = []
        for(let i = 0; i < window.ROLLER_rollers.length; i++)
        {
            current_elements.push(window.ROLLER_rollers[i][0]);
        }
        window.ROLLER_update_rollers = []
        for(let i = 0; i < elements.length; i++)
        {
            let index = current_elements.indexOf(elements[i]);
            if(index >= 0 && window.ROLLER_rollers[index][1] != elements[i].innerText)
            {
                window.ROLLER_update_rollers.push([elements[i], elements[i].innerText]);
                window.ROLLER_rollers[index][1] = elements[i].innerText;
            }else if(index < 0)
            {
                window.ROLLER_update_rollers.push([elements[i], elements[i].innerText]);
                window.ROLLER_rollers.push([elements[i], elements[i].innerText]);
            }
            if(window.ROLLER_duration < elements[i].innerText.length){window.ROLLER_duration = elements[i].innerText.length;}
        }
        console.log(window.ROLLER_update_rollers);
        console.log(window.ROLLER_rollers);
        window.ROLLER_current_frame = 1;
        window.ROLLER_interval = setInterval(function(){
            if(window.ROLLER_rolls_per_letter*window.ROLLER_duration < window.ROLLER_current_frame)
            {
                window.ROLLER_current_frame=-1;
                clearInterval(window.ROLLER_interval);
                return;
            }
            var alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
            for(var i = 0; i < window.ROLLER_update_rollers.length; i++ )
            {
                let len = window.ROLLER_update_rollers[i][1].length;
                if(len > (window.ROLLER_current_frame/window.ROLLER_rolls_per_letter))len=(window.ROLLER_current_frame/window.ROLLER_rolls_per_letter)
                window.ROLLER_update_rollers[i][0].innerText = window.ROLLER_update_rollers[i][1].substring(0,len);
                
                if(len < window.ROLLER_update_rollers[i][1].length)window.ROLLER_update_rollers[i][0].innerHTML += "<a style='opacity:.5;'>" + alphabet[Math.floor(Math.random() * alphabet.length)] + "</a>";
                window.ROLLER_update_rollers[i][0].style.opacity=1;
            }
            
            window.ROLLER_current_frame += 1;
        }, window.ROLLER_anim_speed);
    }

    load()
    {
        window.ROLLER_duration = 0;
        let elements = document.getElementsByClassName("text-roller");
        for(let i = 0; i < elements.length; i++)
        {
            let remove_on_exit = false;
            if(elements[i].classList.contains("text-roller-remove-on-exit"))remove_on_exit = true;
            window.ROLLER_rollers.push([elements[i], elements[i].innerText, remove_on_exit]);
            if(window.ROLLER_duration < elements[i].innerText.length){window.ROLLER_duration = elements[i].innerText.length;}
        }

        window.ROLLER_current_frame = 1;
        window.ROLLER_interval = setInterval(function(){
            if(window.ROLLER_rolls_per_letter*window.ROLLER_duration < window.ROLLER_current_frame)
            {
                for(var i = 0; i < window.ROLLER_rollers.length; i++)
                {
                    if(window.ROLLER_rollers[i][2])
                    {
                        window.ROLLER_rollers[i][0].classList.remove("text-roller");
                    }
                }
                window.ROLLER_current_frame=-1;
                clearInterval(window.ROLLER_interval);
                return;
            }
            var alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
            for(var i = 0; i < window.ROLLER_rollers.length; i++ )
            {
                let len = window.ROLLER_rollers[i][1].length;
                if(len > (window.ROLLER_current_frame/window.ROLLER_rolls_per_letter))len=(window.ROLLER_current_frame/window.ROLLER_rolls_per_letter)
                window.ROLLER_rollers[i][0].innerText = window.ROLLER_rollers[i][1].substring(0,len);
                
                if(len < window.ROLLER_rollers[i][1].length)window.ROLLER_rollers[i][0].innerHTML += "<a style='opacity:.5;'>" + alphabet[Math.floor(Math.random() * alphabet.length)] + "</a>";
            }
            window.ROLLER_current_frame += 1;
        }, window.ROLLER_anim_speed);
    }
}
