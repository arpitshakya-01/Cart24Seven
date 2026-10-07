package EasyCart.Backend.repository;

import EasyCart.Backend.entity.Order;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.stereotype.Repository;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Repository
public class OrderRepository {
    private static final String COLUMNS = "id,customer_name,phone,address,city,state,pincode,product_name,product_image,product_price,product_cost_price,product_operating_cost,product_platform_fee_percent,quantity,subtotal,gst,taxable_value,gst_rate,cgst,sgst,igst,hsn_code,seller_state,seller_gstin,marketplace_commission,commission_gst,tcs,tcs_cgst,tcs_sgst,tcs_igst,net_seller_payout,delivery_charge,total_amount,order_status,order_date,buyer_email,seller_email,product_id,payment_method,payment_status,payment_reference";
    private static final String INSERT = "INSERT INTO orders (customer_name,phone,address,city,state,pincode,product_name,product_image,product_price,product_cost_price,product_operating_cost,product_platform_fee_percent,quantity,subtotal,gst,taxable_value,gst_rate,cgst,sgst,igst,hsn_code,seller_state,seller_gstin,marketplace_commission,commission_gst,tcs,tcs_cgst,tcs_sgst,tcs_igst,net_seller_payout,delivery_charge,total_amount,order_status,order_date,buyer_email,seller_email,product_id,payment_method,payment_status,payment_reference) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)";
    private static final String UPDATE = "UPDATE orders SET customer_name=?,phone=?,address=?,city=?,state=?,pincode=?,product_name=?,product_image=?,product_price=?,product_cost_price=?,product_operating_cost=?,product_platform_fee_percent=?,quantity=?,subtotal=?,gst=?,taxable_value=?,gst_rate=?,cgst=?,sgst=?,igst=?,hsn_code=?,seller_state=?,seller_gstin=?,marketplace_commission=?,commission_gst=?,tcs=?,tcs_cgst=?,tcs_sgst=?,tcs_igst=?,net_seller_payout=?,delivery_charge=?,total_amount=?,order_status=?,order_date=?,buyer_email=?,seller_email=?,product_id=?,payment_method=?,payment_status=?,payment_reference=? WHERE id=?";
    private final JdbcRepositorySupport jdbc;

    public OrderRepository(JdbcRepositorySupport jdbc) { this.jdbc = jdbc; }

    public Order save(Order order) {
        Object[] values = values(order);
        if (order.getId() == null) order.setId(jdbc.insert(INSERT, values));
        else {
            Object[] withId = java.util.Arrays.copyOf(values, values.length + 1);
            withId[values.length] = order.getId();
            if (jdbc.update(UPDATE, withId) == 0) throw new EmptyResultDataAccessException("Order not found", 1);
        }
        return order;
    }

    public List<Order> saveAll(Iterable<Order> orders) {
        List<Order> saved = new ArrayList<>();
        for (Order order : orders) saved.add(save(order));
        return saved;
    }

    private Object[] values(Order o) {
        return new Object[]{o.getCustomerName(),o.getPhone(),o.getAddress(),o.getCity(),o.getState(),o.getPincode(),
                o.getProductName(),o.getProductImage(),o.getProductPrice(),o.getProductCostPrice(),o.getProductOperatingCost(),
                o.getProductPlatformFeePercent(),o.getQuantity(),o.getSubtotal(),o.getGst(),o.getTaxableValue(),o.getGstRate(),
                o.getCgst(),o.getSgst(),o.getIgst(),o.getHsnCode(),o.getSellerState(),o.getSellerGstin(),
                o.getMarketplaceCommission(),o.getCommissionGst(),o.getTcs(),o.getTcsCgst(),o.getTcsSgst(),o.getTcsIgst(),
                o.getNetSellerPayout(),o.getDeliveryCharge(),o.getTotalAmount(),o.getOrderStatus(),o.getOrderDate(),
                o.getBuyerEmail(),o.getSellerEmail(),o.getProductId(),o.getPaymentMethod(),o.getPaymentStatus(),o.getPaymentReference()};
    }

    public Optional<Order> findById(Long id) { return jdbc.queryOne("SELECT " + COLUMNS + " FROM orders WHERE id=?", this::map, id); }
    public Optional<Order> findByIdForBuyerUpdate(Long id, String buyerEmail) { return jdbc.queryOne("SELECT " + COLUMNS + " FROM orders WHERE id=? AND LOWER(buyer_email)=LOWER(?) FOR UPDATE", this::map, id, buyerEmail); }
    public List<Order> findAllByOrderByOrderDateDesc() { return jdbc.query("SELECT " + COLUMNS + " FROM orders ORDER BY order_date DESC,id DESC", this::map); }
    public List<Order> findByBuyerEmailOrderByOrderDateDesc(String email) { return jdbc.query("SELECT " + COLUMNS + " FROM orders WHERE LOWER(buyer_email)=LOWER(?) ORDER BY order_date DESC,id DESC", this::map, email); }
    public List<Order> findBySellerEmailOrderByOrderDateDesc(String email) { return jdbc.query("SELECT " + COLUMNS + " FROM orders WHERE LOWER(seller_email)=LOWER(?) ORDER BY order_date DESC,id DESC", this::map, email); }

    private Order map(ResultSet r) throws SQLException {
        Order o = new Order();
        o.setId(r.getLong("id"));
        o.setCustomerName(r.getString("customer_name")); o.setPhone(r.getString("phone")); o.setAddress(r.getString("address"));
        o.setCity(r.getString("city")); o.setState(r.getString("state")); o.setPincode(r.getString("pincode"));
        o.setProductName(r.getString("product_name")); o.setProductImage(r.getString("product_image"));
        o.setProductPrice(JdbcRepositorySupport.nullableDouble(r,"product_price"));
        o.setProductCostPrice(JdbcRepositorySupport.nullableDouble(r,"product_cost_price"));
        o.setProductOperatingCost(JdbcRepositorySupport.nullableDouble(r,"product_operating_cost"));
        o.setProductPlatformFeePercent(JdbcRepositorySupport.nullableDouble(r,"product_platform_fee_percent"));
        o.setQuantity(JdbcRepositorySupport.nullableInt(r,"quantity")); o.setSubtotal(JdbcRepositorySupport.nullableDouble(r,"subtotal"));
        o.setGst(JdbcRepositorySupport.nullableDouble(r,"gst")); o.setTaxableValue(JdbcRepositorySupport.nullableDouble(r,"taxable_value"));
        o.setGstRate(JdbcRepositorySupport.nullableDouble(r,"gst_rate")); o.setCgst(JdbcRepositorySupport.nullableDouble(r,"cgst"));
        o.setSgst(JdbcRepositorySupport.nullableDouble(r,"sgst")); o.setIgst(JdbcRepositorySupport.nullableDouble(r,"igst"));
        o.setHsnCode(r.getString("hsn_code")); o.setSellerState(r.getString("seller_state")); o.setSellerGstin(r.getString("seller_gstin"));
        o.setMarketplaceCommission(JdbcRepositorySupport.nullableDouble(r,"marketplace_commission"));
        o.setCommissionGst(JdbcRepositorySupport.nullableDouble(r,"commission_gst")); o.setTcs(JdbcRepositorySupport.nullableDouble(r,"tcs"));
        o.setTcsCgst(JdbcRepositorySupport.nullableDouble(r,"tcs_cgst")); o.setTcsSgst(JdbcRepositorySupport.nullableDouble(r,"tcs_sgst"));
        o.setTcsIgst(JdbcRepositorySupport.nullableDouble(r,"tcs_igst")); o.setNetSellerPayout(JdbcRepositorySupport.nullableDouble(r,"net_seller_payout"));
        o.setDeliveryCharge(JdbcRepositorySupport.nullableDouble(r,"delivery_charge")); o.setTotalAmount(JdbcRepositorySupport.nullableDouble(r,"total_amount"));
        o.setOrderStatus(r.getString("order_status")); LocalDateTime date = JdbcRepositorySupport.nullableDateTime(r,"order_date");
        if (date != null) o.setOrderDate(date);
        o.setBuyerEmail(r.getString("buyer_email")); o.setSellerEmail(r.getString("seller_email"));
        o.setProductId(JdbcRepositorySupport.nullableLong(r,"product_id")); o.setPaymentMethod(r.getString("payment_method"));
        o.setPaymentStatus(r.getString("payment_status")); o.setPaymentReference(r.getString("payment_reference"));
        return o;
    }
}
