
/*
default return false, return true if has errors
*/
function validateInput(email, password, passwordConfirmation) {
    //check email
    const EMAIL_REG = /[a-zA-Z][a-zA-Z0-9_\.]{1,32}@[a-z0-9]{2,}(\.[a-z0-9]{2,4}){1,2}/g;
    if(email.match(EMAIL_REG)){
        $("#email").removeClass("is-invalid");
    } else {//empty email input or invalid email
        $("#email").addClass("is-invalid");
    }    

    //check password
    if(password.length>8 || password.search(/[!"#$%&'()*+,-.:;<=>?@[\]^_`{|}~]/) > 0 || password.search(/[A-Z]/) > 0){
        $("#password").removeClass("is-invalid");
    } else {//empty password input or invalid password
        $("#password").addClass("is-invalid");
    }  

    //check passwordConfirmation
    if(passwordConfirmation === password){
        $("#passwordConfirmation").removeClass("is-invalid");
    } else {
        $("#passwordConfirmation").addClass("is-invalid");
    }  

    if(!email.match(EMAIL_REG) || password.length<8 || password.search(/[!"#$%&'()*+,-.:;<=>?@[\]^_`{|}~]/) < 0 || password.search(/[A-Z]/) < 0 || password !== passwordConfirmation){
        return true; //has errors
    }
    
    return false;

}

function handleClickRegisterBtn() {
    $("#registerBtn").on("click", function (event) {
        event.preventDefault();

        let fname = $("#fname").val();
        let lname = $("#lname").val();
        let email = $("#email").val();
        let username = $("#username").val();
        let password = $("#password").val();
        let passwordConfirmation = $("#passwordConfirmation").val();

        //validate input
        let check = validateInput(email, password, passwordConfirmation);

        if (!check) {
            //send data to node server with ajax
            //url map to http://localhost/register-new-user
            $.ajax({
                url: `${window.location.origin}/register-new-user`,
                method: "POST",
                data: {fname: fname, lname: lname, email: email, username: username, password: password, passwordConfirmation: passwordConfirmation},
                success: function(data) {
                    alert("Created a new user successful");
                    window.location.href = "/login";
                },
                error: function(err) {
                    alert(err.responseText);
                }
            });
        }
    });
}

$(document).ready(function () {
    handleClickRegisterBtn();
})

