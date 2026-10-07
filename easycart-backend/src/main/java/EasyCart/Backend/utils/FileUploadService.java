package EasyCart.Backend.utils;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.*;
import java.util.UUID;

@Service
public class FileUploadService {

    @Value("${file.upload-dir}")
    private String uploadDir;

    public String uploadFile(MultipartFile file) {
        if (file == null || file.isEmpty()) throw new IllegalArgumentException("Choose a file to upload.");
        String contentType = file.getContentType() == null ? "" : file.getContentType().toLowerCase();
        if (!(contentType.startsWith("image/") || contentType.equals("video/mp4") || contentType.equals("video/webm") || contentType.equals("video/quicktime")))
            throw new IllegalArgumentException("Upload an image or MP4, WebM, or MOV video.");
        try {
            // Create uploads folder if it doesn't exist
            Path uploadPath = Paths.get(uploadDir);

            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            // Generate unique file name
            String originalFileName = file.getOriginalFilename();
            String extension = "";

            if (originalFileName != null && originalFileName.contains(".")) {
                extension = originalFileName.substring(originalFileName.lastIndexOf("."));
            }

            String fileName = UUID.randomUUID() + extension;

            // Save file
            Path filePath = uploadPath.resolve(fileName);
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

            return fileName;

        } catch (IOException e) {
            throw new RuntimeException("Image upload failed: " + e.getMessage());
        }
    }
}
