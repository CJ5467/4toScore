
function handleLoginBtn(){
    $("#loginBtn").on("click", function(event) {
        event.preventDefault();
        let username = $("#username").val();
        let password = $("#password").val();

        $.ajax({
            url: `${window.location.origin}/login`,
            method: "POST",
            data: {username: username, password: password},
            success: function(data) {
                window.location.href="/";
            },
            error: function(err) {
                alert("Your email or password entered is incorrect. Please try again!");
            }
        });
    })
}

$(document).ready(function() {
    handleLoginBtn();
});