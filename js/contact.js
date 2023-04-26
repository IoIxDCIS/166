
$(window).on("load", () => {
    const params = new URLSearchParams(window.location.search);
    const length = Array.from(params.values()).length;
    if(length <= 4) {
        return;
    }
    let first_name      = params.get("first_name");
    let last_name       = params.get("last_name");
    let date            = params.get("date");
    let cell_phone      = params.get("cell_phone");
    let school_name     = params.get("school_name");
    let information     = params.get("information");

    let subject = encodeURIComponent(`Message from ${first_name} ${last_name}`);
    let body = encodeURIComponent(`Message from ${first_name} ${last_name} on ${date}. Phone Number is ${cell_phone}. Goes to ${school_name}. "${information}"`);
    window.location.href = `mailto:alphaproject217@gmail.com?subject=${subject}&body="${body}"`
});