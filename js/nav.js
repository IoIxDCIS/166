$(window).on('load', function() {
    document.body.innerHTML += `
    <nav>
        ...
        <span class="inner">
            <ul>
                <li><a href='/html/index.html'>Home</a></li>
                <li><a href='/html/contact.html'>Contact</a></li>
                <li><a href="/html/demo.html">Demo</a></li>
            </ul>
        </span>
    </nav>
    `;
});