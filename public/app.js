$.getJSON("/articles", function(data) {
    for (var i = 0; i < data.length; i++) {
      $("#articles").append("<p data-id='" + data[i]._id + "'><b>" + data[i].title + "</b><br />" + data[i].link + "</p>");
    }
  });
  
  
  $(document).on("click", "p", function() {
    $("#notes").empty();
    var thisId = $(this).attr("data-id");
  
    // Now make an ajax call for the Article
    $.ajax({
      method: "GET",
      url: "/articles/" + thisId
    })
      // Add the note components to the page
      .done(function(data) {
        console.log(data);
        $("#notes").append("<h3>" + data.title + "</h3>");
        $("#notes").append("<input id='titleinput' name='title' placeholder='Note Title'>");
        $("#notes").append("<textarea id='bodyinput' name='body' placeholder='Note Text'></textarea>");
        $("#notes").append("<button class='btn btn-raised btn-success' data-id='" + data._id + "' id='savenote'>Submit</button>");
  
        // If there's already a saved note for a given article, populate accordingly
        if (data.note) {
          $("#titleinput").val(data.note.title);
          $("#bodyinput").val(data.note.body);
        }
      });
  });
  
  // Logic to save the added/updated note when the savenote button is clicked
  $(document).on("click", "#savenote", function() {
    var thisId = $(this).attr("data-id");
  
    $.ajax({
      method: "POST",
      url: "/articles/" + thisId,
      data: {
        title: $("#titleinput").val(),
        body: $("#bodyinput").val()
      }
    })
      .done(function(data) {
        console.log(data);
        $("#notes").empty();
      });
  
    $("#titleinput").val("");
    $("#bodyinput").val("");
});