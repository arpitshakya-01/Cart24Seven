package EasyCart.Backend.controller;

import EasyCart.Backend.dto.CatalogSummary;
import EasyCart.Backend.service.CatalogAnalyticsService;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@CrossOrigin(origins = "${APP_FRONTEND_ORIGIN:http://localhost:5173}")
@RequestMapping("/api/admin/catalog")
public class CatalogAnalyticsController {
    private final CatalogAnalyticsService analytics;

    public CatalogAnalyticsController(CatalogAnalyticsService analytics) {
        this.analytics = analytics;
    }

    @GetMapping("/concurrent-summary")
    public CatalogSummary concurrentSummary() {
        return analytics.createConcurrentSummary();
    }
}
