
class TextBlinker {

    constructor(anim_speed)
    {
        window.BLINKER_blinkers = [];
        window.BLINKER_anim_speed = anim_speed*100;
        window.BLINKER_interval;
    }

    load()
    {
        clearInterval(window.BLINKER_interval);

        let elements = document.getElementsByClassName("text-blinker");
        for(let i = 0; i < elements.length; i++)
        {
            let classes = elements[i].classList;
            let char_to_blink = "";
            for(let j = 0; j < classes.length; j++)
            {
                if(classes[j].includes("blinker-"))
                {
                    char_to_blink = classes[j].split("blinker-")[1];
                }
            }
            window.BLINKER_blinkers.push([elements[i], elements[i].innerText,char_to_blink]);
        }

        window.BLINKER_current_frame = 0;
        window.BLINKER_interval = setInterval(function(){
            for(var i = 0; i < window.BLINKER_blinkers.length; i++ )
            {
                if(window.BLINKER_current_frame % 2 == 0)
                {
                    window.BLINKER_blinkers[i][0].innerText = window.BLINKER_blinkers[i][0].innerText + window.BLINKER_blinkers[i][2]
                }else{
                    let new_text_pieces = window.BLINKER_blinkers[i][0].innerText.split(window.BLINKER_blinkers[i][2]);
                    let new_text = ""
                    for(var j = 0; j < new_text_pieces.length; j++)
                    {
                        new_text += new_text_pieces[j];
                    }
                    window.BLINKER_blinkers[i][0].innerText = new_text;
                }
            }
            window.BLINKER_current_frame += 1;
        }, window.BLINKER_anim_speed);
    }
}
