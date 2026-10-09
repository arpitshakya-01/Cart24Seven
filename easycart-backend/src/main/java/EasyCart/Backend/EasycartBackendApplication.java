package EasyCart.Backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.web.servlet.ServletComponentScan;

@SpringBootApplication
@ServletComponentScan
public class EasycartBackendApplication {

	public static void main(String[] args) {
		SpringApplication.run(EasycartBackendApplication.class, args);
	}

}
