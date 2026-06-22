$(document).ready(function () {
    const url = 'http://localhost:3000/';
    const token = JSON.parse(sessionStorage.getItem('token'));
    const role = sessionStorage.getItem('role');

    if (!token) {
        window.location.href = 'login.html';
    } else if (role !== 'admin') {
        $('body').show(); // show body so swal is visible
        Swal.fire({
            icon: 'error',
            title: 'Access Denied',
            text: 'You do not have permission to access this page.',
            confirmButtonColor: '#8b1a4a'
        }).then(() => {
            window.location.href = 'home.html';
        });
    } else {
        $('body').show(); // admin — show the page normally
    }

    let barChartInstance = null;
    let pieChartInstance = null;
    let lineChartInstance = null;

    $.get("header.html?v=" + new Date().getTime(), function (data) {
        $("#header").html(data);
        $('#nav-login').hide();
        $('#nav-logout').show();
        $('#nav-profile').show();
        $('#nav-dashboard').show();
        $('#nav-my-orders').hide();

        $(document).on('click', '#btn-logout', function (e) {
            e.preventDefault();
            const token = JSON.parse(sessionStorage.getItem('token'));
            $.ajax({
                method: 'POST',
                url: `${url}api/v1/logout`,
                headers: { Authorization: `Bearer ${token}` },
                success: function () {
                    sessionStorage.clear();
                    window.location.href = 'login.html';
                },
                error: function () {
                    sessionStorage.clear();
                    window.location.href = 'login.html';
                }
            });
        });
    });

    function loadCharts(period = 'all') {
        $.ajax({
            method: 'GET',
            url: `${url}api/v1/dashboard/charts?period=${period}`,
            headers: { Authorization: `Bearer ${token}` },
            success: function (data) {

                // Update stats
                $('#total-products').text(data.stats.totalProducts);
                $('#total-orders').text(data.stats.totalOrders);
                $('#total-users').text(data.stats.totalUsers);
                $('#total-categories').text(data.stats.totalCategories);

                // Destroy existing charts before re-render
                if (barChartInstance) barChartInstance.destroy();
                if (pieChartInstance) pieChartInstance.destroy();
                if (lineChartInstance) lineChartInstance.destroy();

                // Bar Chart — Stock per Product
                barChartInstance = new Chart($('#barChart'), {
                    type: 'bar',
                    data: {
                        labels: data.barChart.labels,
                        datasets: [{
                            label: 'Stock Quantity',
                            data: data.barChart.data,
                            backgroundColor: data.barChart.labels.map((_, i) =>
                                `hsl(${(i * 47) % 360}, 65%, 55%)`
                            ),
                            borderWidth: 1
                        }]
                    },
                    options: {
                        responsive: true,
                        plugins: { legend: { display: false } },
                        scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
                    }
                });

                // Pie Chart — Top Selling Products
                pieChartInstance = new Chart($('#pieChart'), {
                    type: 'pie',
                    data: {
                        labels: data.pieChart.labels.length > 0
                            ? data.pieChart.labels
                            : ['No Data'],
                        datasets: [{
                            data: data.pieChart.data.length > 0
                                ? data.pieChart.data
                                : [1],
                            backgroundColor: data.pieChart.labels.map((_, i) =>
                                `hsl(${(i * 60) % 360}, 65%, 55%)`
                            ),
                            borderColor: '#fff',
                            borderWidth: 2
                        }]
                    },
                    options: {
                        responsive: true,
                        plugins: { legend: { position: 'bottom' } }
                    }
                });

                // Line Chart — Orders per Day
                lineChartInstance = new Chart($('#lineChart'), {
                    type: 'line',
                    data: {
                        labels: data.lineChart.labels,
                        datasets: [{
                            label: 'Orders per Day',
                            data: data.lineChart.data,
                            borderColor: '#8b1a4a',
                            backgroundColor: 'rgba(139,26,74,0.1)',
                            tension: 0.4,
                            fill: true,
                            pointBackgroundColor: '#8b1a4a'
                        }]
                    },
                    options: {
                        responsive: true,
                        plugins: { legend: { display: true } },
                        scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
                    }
                });
            },
            error: function (err) {
                console.log('Chart data error:', err);
            }
        });
    }

    // Load default
    loadCharts('all');

    // Period filter buttons
    $(document).on('click', '.btn-period', function () {
        $('.btn-period').removeClass('active');
        $(this).addClass('active');
        const period = $(this).data('period');
        loadCharts(period);
    });
});