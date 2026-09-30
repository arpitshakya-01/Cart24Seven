package EasyCart.Backend.controller;

import EasyCart.Backend.utils.FileUploadService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/upload")
@CrossOrigin(origins = "*")
public class UploadController {

    @Autowired
    private FileUploadService fileUploadService;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Map<String, String> uploadImage(
            @RequestParam("image") MultipartFile image) {

        String fileName = fileUploadService.uploadFile(image);

        Map<String, String> response = new HashMap<>();
        response.put("message", "Image uploaded successfully");
        response.put("fileName", fileName);
        response.put("imageUrl", "/uploads/" + fileName);

        return response;
    }
}
