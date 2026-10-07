package EasyCart.Backend.controller;

import EasyCart.Backend.utils.FileUploadService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.Map;
import java.util.List;
import java.util.ArrayList;

@RestController
@RequestMapping("/api/upload")
@CrossOrigin(origins = "${APP_FRONTEND_ORIGIN:http://localhost:5173}")
public class UploadController {

    @Autowired
    private FileUploadService fileUploadService;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Map<String, String> uploadImage(
            @RequestParam("image") MultipartFile image) {

        String fileName = fileUploadService.uploadFile(image);

        Map<String, String> response = new HashMap<>();
        response.put("message", "Media uploaded successfully");
        response.put("fileName", fileName);
        response.put("imageUrl", "/uploads/" + fileName);

        return response;
    }

    @PostMapping(value="/multiple", consumes=MediaType.MULTIPART_FORM_DATA_VALUE)
    public List<Map<String,String>> uploadMultiple(@RequestParam("files") List<MultipartFile> files) {
        List<Map<String,String>> result=new ArrayList<>();
        for (MultipartFile file:files) { String name=fileUploadService.uploadFile(file); result.add(Map.of("url","/uploads/"+name,"type",file.getContentType()!=null && file.getContentType().startsWith("video/") ? "VIDEO" : "IMAGE")); }
        return result;
    }
}
